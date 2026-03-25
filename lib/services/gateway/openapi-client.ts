type OpenApiOperation = {
  operationId?: string;
};

type OpenApiPathItem = Record<string, OpenApiOperation | undefined>;

type OpenApiSpec = {
  servers?: Array<{
    url?: string;
  }>;
  paths?: Record<string, OpenApiPathItem | undefined>;
};

export type OpenApiRequestInput = {
  specUrl: string;
  operationId: string;
  body?: unknown;
  bearerToken?: string;
};

export type OpenApiRequestResult = {
  status: number;
  contentType: string;
  headers: Record<string, string>;
  payload: unknown;
  url: string;
  method: string;
};

type ResolvedOperation = {
  path: string;
  method: string;
};

const HTTP_METHODS = ["get", "put", "post", "patch", "delete", "head", "options", "trace"] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringifyQueryValue(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function resolveSpecBaseUrl(specUrl: string, spec: OpenApiSpec) {
  const serverUrl = spec.servers?.[0]?.url;
  if (!serverUrl) {
    return new URL(specUrl).origin;
  }

  return new URL(serverUrl, specUrl).toString();
}

async function loadOpenApiSpec(specUrl: string) {
  const response = await fetch(specUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${response.status}`);
  }

  return (await response.json()) as OpenApiSpec;
}

function findOperationById(spec: OpenApiSpec, operationId: string): ResolvedOperation {
  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    if (!pathItem) {
      continue;
    }

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method];
      if (operation?.operationId === operationId) {
        return {
          path,
          method: method.toUpperCase()
        };
      }
    }
  }

  throw new Error(`OpenAPI operation not found: ${operationId}`);
}

function buildUpstreamUrl(baseUrl: string, path: string, body: unknown, method: string) {
  const requestUrl = new URL(baseUrl);
  const normalizedPath = path.replace(/^\/+/, "");
  const normalizedBasePath = requestUrl.pathname.endsWith("/")
    ? requestUrl.pathname
    : `${requestUrl.pathname}/`;
  const consumedKeys = new Set<string>();
  const requestBody = isPlainObject(body) ? body : undefined;
  const resolvedPath = `${normalizedBasePath}${normalizedPath}`.replace(
    /\{([^}]+)\}/g,
    (_match, name: string) => {
      if (!requestBody) {
        throw new Error(`Missing path parameter: ${name}`);
      }

      const value = requestBody[name];
      if (value === undefined || value === null) {
        throw new Error(`Missing path parameter: ${name}`);
      }

      consumedKeys.add(name);
      return encodeURIComponent(String(value));
    }
  );

  requestUrl.pathname = resolvedPath;

  if (method === "GET" && requestBody) {
    for (const [key, value] of Object.entries(requestBody)) {
      if (consumedKeys.has(key) || value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          const serialized = stringifyQueryValue(item);
          if (serialized !== null) {
            requestUrl.searchParams.append(key, serialized);
          }
        }
        continue;
      }

      const serialized = stringifyQueryValue(value);
      if (serialized !== null) {
        requestUrl.searchParams.set(key, serialized);
      }
    }
  }

  return {
    url: requestUrl.toString(),
    body:
      method === "GET" || body === undefined
        ? undefined
        : typeof body === "string"
          ? body
          : JSON.stringify(body)
  };
}

async function parseUpstreamResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  const headers = Object.fromEntries(response.headers.entries());
  const rawText = await response.text();

  if (contentType.includes("json")) {
    if (rawText.trim() === "") {
      return {
        contentType,
        headers,
        payload: null
      };
    }

    try {
      return {
        contentType,
        headers,
        payload: JSON.parse(rawText)
      };
    } catch {
      return {
        contentType,
        headers,
        payload: rawText
      };
    }
  }

  return {
    contentType,
    headers,
    payload: rawText
  };
}

export async function resolveOpenApiOperationRequest(
  input: OpenApiRequestInput
): Promise<OpenApiRequestResult> {
  const spec = await loadOpenApiSpec(input.specUrl);
  const operation = findOperationById(spec, input.operationId);
  const baseUrl = resolveSpecBaseUrl(input.specUrl, spec);
  const upstreamRequest = buildUpstreamUrl(baseUrl, operation.path, input.body, operation.method);

  const headers = new Headers();
  if (input.bearerToken) {
    headers.set("authorization", `Bearer ${input.bearerToken}`);
  }

  if (upstreamRequest.body !== undefined) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(upstreamRequest.url, {
    method: operation.method,
    headers,
    body: upstreamRequest.body
  });

  const parsed = await parseUpstreamResponse(response);
  return {
    status: response.status,
    url: upstreamRequest.url,
    method: operation.method,
    ...parsed
  };
}
