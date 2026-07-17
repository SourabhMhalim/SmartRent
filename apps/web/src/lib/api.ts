const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "/app/smartrent"
    : "http://localhost:8080");

type ApiError = {
  message?: string;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email?: string;
    phone?: string;
    user_metadata?: {
      full_name?: string;
      phone?: string;
    };
  };
};

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: "LANDLORD" | "PROPERTY_MANAGER" | "TENANT";
};

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = (await response.json().catch(() => ({}))) as T & ApiError;

  if (!response.ok) {
    throw new Error(body.message ?? "Request failed. Please try again.");
  }

  return body;
}

export async function authenticatedApiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const session = getSession();
  if (!session) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  return apiRequest<T>(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });
}

export async function authenticatedBlobRequest(
  path: string,
  options: RequestInit = {},
): Promise<Blob> {
  const session = getSession();
  if (!session) {
    throw new Error("Your session has expired. Please sign in again.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(body.message ?? "Request failed. Please try again.");
  }

  return response.blob();
}

export function getCurrentUser() {
  return authenticatedApiRequest<CurrentUser>("/api/me");
}

export function storeSession(session: AuthSession) {
  clearSession();
  sessionStorage.setItem("smartrent_session", JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  const stored = sessionStorage.getItem("smartrent_session");

  if (!stored) {
    return null;
  }

  try {
    const session = JSON.parse(stored) as AuthSession;
    const payload = parseJwtPayload(session.access_token);

    if (!session.access_token || !payload.exp || payload.exp * 1000 <= Date.now()) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem("smartrent_session");
}

function parseJwtPayload(token: string): { exp?: number } {
  const encodedPayload = token.split(".")[1];
  if (!encodedPayload) {
    return {};
  }

  const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return JSON.parse(atob(padded)) as { exp?: number };
}
