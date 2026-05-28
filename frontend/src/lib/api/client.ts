// Typed fetch wrapper for the .NET API.
// Reads NEXT_PUBLIC_API_BASE_URL from the environment; never reads server-only API_BASE_URL.
//
// See ADR-0006: the JWT lives in an httpOnly cookie, so we always send credentials and
// never touch a token in JS.

const API_BASE_URL =
  process.env["NEXT_PUBLIC_API_BASE_URL"] ?? "http://localhost:5000";

// Auth endpoints that must never trigger a silent-refresh retry (would cause loops).
const NO_REFRESH_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
]);

async function apiFetch(
  path: string,
  init: RequestInit = {},
  _retry = true,
): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  // On 401, attempt a silent token refresh then replay the original request once.
  if (response.status === 401 && _retry && !NO_REFRESH_PATHS.has(path)) {
    const refreshed = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshed.ok) {
      // Token renewed — replay the original request (no further retries).
      return apiFetch(path, init, false);
    }

    // Refresh failed (expired too long ago, user deleted, locked out, etc.).
    // Redirect to login on the client; on the server there is no window.
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

  return response;
}

// Auth
export async function apiRefresh(): Promise<Response> {
  return fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
}

export async function apiRegister(
  email: string,
  password: string,
): Promise<Response> {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function apiLogin(
  email: string,
  password: string,
): Promise<Response> {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function apiLogout(): Promise<Response> {
  return apiFetch("/api/auth/logout", { method: "POST" });
}

export async function apiMe(): Promise<Response> {
  return apiFetch("/api/auth/me");
}

// Books
export async function apiListBooks(): Promise<Response> {
  return apiFetch("/api/books");
}

export async function apiGetBook(id: string): Promise<Response> {
  return apiFetch(`/api/books/${id}`);
}

export async function apiCreateBook(
  data: CreateBookPayload,
): Promise<Response> {
  return apiFetch("/api/books", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiUpdateBook(
  id: string,
  data: CreateBookPayload,
): Promise<Response> {
  return apiFetch(`/api/books/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteBook(id: string): Promise<Response> {
  return apiFetch(`/api/books/${id}`, { method: "DELETE" });
}

// Open Library
export async function apiSearchOpenLibrary(
  q: string,
  limit = 10,
): Promise<Response> {
  return apiFetch(
    `/api/open-library/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  );
}

export interface CreateBookPayload {
  title: string;
  author: string;
  isbn: string | null;
  coverUrl: string | null;
  openLibraryWorkId: string | null;
  status: "wantToRead" | "reading" | "read";
  rating: number | null;
  notes: string | null;
  dateFinished: string | null;
}
