import { beforeEach, describe, expect, it, vi } from "vitest";

describe("resolveOpenApiOperationRequest", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves a relative server URL, fills path params, appends GET query params, and parses JSON", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            openapi: "3.1.0",
            servers: [{ url: "/v1" }],
            paths: {
              "/widgets/{widgetId}": {
                get: {
                  operationId: "getWidget"
                }
              }
            }
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: true
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        )
      );

    const { resolveOpenApiOperationRequest } = await import(
      "@/lib/services/gateway/openapi-client"
    );

    const result = await resolveOpenApiOperationRequest({
      specUrl: "https://example.com/specs/openapi.json",
      operationId: "getWidget",
      body: {
        widgetId: "abc 123",
        include: "details",
        tags: ["a", "b"],
        filter: {
          limit: 10
        }
      },
      bearerToken: "test-token"
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const [specUrl, specInit] = fetchSpy.mock.calls[0] ?? [];
    expect(specUrl).toBe("https://example.com/specs/openapi.json");
    expect(specInit).toBeUndefined();

    const [upstreamUrl, upstreamInit] = fetchSpy.mock.calls[1] ?? [];
    expect(upstreamUrl).toBe(
      "https://example.com/v1/widgets/abc%20123?include=details&tags=a&tags=b&filter=%7B%22limit%22%3A10%7D"
    );
    expect(upstreamInit?.method).toBe("GET");
    expect((upstreamInit?.headers as Headers).get("authorization")).toBe(
      "Bearer test-token"
    );

    expect(result.status).toBe(200);
    expect(result.contentType).toBe("application/json");
    expect(result.payload).toEqual({ ok: true });
  });

  it("sends non-GET request bodies as JSON and returns text payloads", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            openapi: "3.1.0",
            servers: [{ url: "https://api.example.com" }],
            paths: {
              "/orders": {
                post: {
                  operationId: "createOrder"
                }
              }
            }
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response("created", {
          status: 201,
          headers: {
            "content-type": "text/plain"
          }
        })
      );

    const { resolveOpenApiOperationRequest } = await import(
      "@/lib/services/gateway/openapi-client"
    );

    const result = await resolveOpenApiOperationRequest({
      specUrl: "https://example.com/specs/openapi.json",
      operationId: "createOrder",
      body: {
        sku: "SKU-1",
        quantity: 2
      }
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    const [upstreamUrl, upstreamInit] = fetchSpy.mock.calls[1] ?? [];
    expect(upstreamUrl).toBe("https://api.example.com/orders");
    expect(upstreamInit?.method).toBe("POST");
    expect((upstreamInit?.headers as Headers).get("content-type")).toBe(
      "application/json"
    );
    expect(upstreamInit?.body).toBe(JSON.stringify({ sku: "SKU-1", quantity: 2 }));

    expect(result.status).toBe(201);
    expect(result.contentType).toBe("text/plain");
    expect(result.payload).toBe("created");
  });

  it("throws when the operationId cannot be found", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          openapi: "3.1.0",
          servers: [{ url: "https://api.example.com" }],
          paths: {}
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        }
      )
    );

    const { resolveOpenApiOperationRequest } = await import(
      "@/lib/services/gateway/openapi-client"
    );

    await expect(
      resolveOpenApiOperationRequest({
        specUrl: "https://example.com/specs/openapi.json",
        operationId: "missingOperation"
      })
    ).rejects.toThrow("OpenAPI operation not found: missingOperation");
  });
});
