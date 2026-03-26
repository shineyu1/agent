import {
  readWebSessionToken,
  SELLEROS_SESSION_COOKIE
} from "@/lib/auth/session-bridge";
import { readSellerAgentAccessToken } from "@/lib/auth/agent-session";

type WebSession = NonNullable<ReturnType<typeof readWebSessionToken>>;

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  return new Map(
    cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separator = entry.indexOf("=");
        if (separator === -1) {
          return [entry, ""];
        }

        return [entry.slice(0, separator), decodeURIComponent(entry.slice(separator + 1))];
      })
  );
}

export function readRequestWebSession(request: Request): WebSession | null {
  const cookies = parseCookieHeader(request.headers.get("cookie"));
  const sessionToken = cookies.get(SELLEROS_SESSION_COOKIE);

  if (!sessionToken) {
    return null;
  }

  return readWebSessionToken(sessionToken);
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ", 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

export function readRequestSellerAgentSession(request: Request) {
  const token = readBearerToken(request);
  if (!token) {
    return null;
  }

  return readSellerAgentAccessToken(token);
}

export function readSellerSessionFromRequest(request: Request) {
  const agentSession = readRequestSellerAgentSession(request);
  if (agentSession) {
    return {
      ok: true as const,
      session: {
        ...agentSession,
        redirectTo: "/providers"
      }
    };
  }

  const session = readRequestWebSession(request);

  if (!session) {
    return {
      ok: false as const,
      status: 401,
      message: "Seller session required"
    };
  }

  if (session.role !== "seller") {
    return {
      ok: false as const,
      status: 403,
      message: "Seller session required"
    };
  }

  return {
    ok: true as const,
    session
  };
}
