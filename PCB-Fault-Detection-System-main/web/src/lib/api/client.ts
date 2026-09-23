const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pcb_access_token");
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("pcb_access_token", token);
  } else {
    localStorage.removeItem("pcb_access_token");
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        setStoredToken(null);
        window.location.href = "/login?expired=1";
      }
      throw new ApiError("Session expired. Please sign in again.", 401);
    }

    if (res.status === 403) {
      throw new ApiError("You do not have permission to perform this action.", 403);
    }

    if (res.status === 404) {
      throw new ApiError("The requested resource was not found.", 404);
    }

    if (!res.ok) {
      let errorDetail = "Server error occurred.";
      try {
        const errorJson = await res.json();
        errorDetail = errorJson.detail || errorDetail;
      } catch {
        // Fallback to generic message
      }
      throw new ApiError(errorDetail, res.status);
    }

    // Check for empty body or download
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Unable to connect to PCB-Vision backend service. Ensure API server is running.",
      0
    );
  }
}
