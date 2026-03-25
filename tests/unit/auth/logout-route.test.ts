import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/logout/route";

describe("/api/auth/logout", () => {
  it("clears the web session cookie", async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("selleros_session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
