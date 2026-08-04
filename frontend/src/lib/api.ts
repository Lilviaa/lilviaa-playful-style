import { auth } from "./firebase";

/**
 * Helper to read a specific cookie by name
 */
export function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface FetchOptions extends RequestInit {
  skipRefresh?: boolean; // Avoid infinite loops if refresh itself fails
}

let refreshPromise: Promise<Response> | null = null;

/**
 * Core API wrapper that handles cookies, CSRF, and silent token refresh.
 */
export async function apiFetch(endpoint: string, options: FetchOptions = {}): Promise<Response> {
  let url = `${API_BASE_URL}${endpoint}`;
  
  // In SSR (Server-Side Rendering), fetch requires an absolute URL.
  // If API_BASE_URL is a relative path (e.g., /api/v1), we must prepend the host.
  if (typeof window === "undefined" && url.startsWith("/")) {
    url = `https://lilviaa-playful-style.vercel.app${url}`;
  }

  const headers = new Headers(options.headers || {});
  
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch (e) {
      console.warn("Failed to get Firebase token", e);
    }
  }

  // Set Content-Type by default if there's a body and it's not FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Handle CSRF for state-changing requests
  const method = (options.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = getCookie("csrf_token");
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include", // Essential for sending/receiving httpOnly cookies
  };

  let response = await fetch(url, fetchOptions);

  // Handle Token Refresh on 401
  if (response.status === 401 && !options.skipRefresh && endpoint !== "/auth/login" && endpoint !== "/auth/refresh") {
    // Attempt to refresh with concurrency lock
    if (!refreshPromise) {
      refreshPromise = fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "X-CSRF-Token": getCookie("csrf_token") || "",
        }
      });
      refreshPromise.finally(() => {
        refreshPromise = null;
      });
    }

    const refreshResponse = await refreshPromise;

    if (refreshResponse.ok) {
      // Tokens rotated successfully, retry original request
      // We need to re-grab the CSRF token in case it changed
      const newCsrf = getCookie("csrf_token");
      if (newCsrf && headers.has("X-CSRF-Token")) {
        headers.set("X-CSRF-Token", newCsrf);
      }
      fetchOptions.headers = headers;
      
      response = await fetch(url, fetchOptions);
    } else {
      // Refresh failed (expired/invalid). Force logout.
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("session-expired"));
      }
      // Return the original 401 response instead of throwing to prevent unhandled rejection alerts
      return response;
    }
  }

  return response;
}
