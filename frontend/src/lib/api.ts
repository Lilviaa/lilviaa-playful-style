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
  
  // Wait for Firebase auth to be fully ready before checking currentUser.
  // This prevents a race condition where currentUser is null during page navigation
  // even though the user is actually logged in (Firebase just hasn't loaded from cache yet).
  let hadToken = false;
  if (typeof window !== "undefined") {
    try {
      await auth.authStateReady();
    } catch (_) {
      // ignore — auth may not be initialized in SSR
    }
  }
  
  if (auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
        hadToken = true;
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

  // Handle Token Refresh on 401 — only fire session-expired if we actually sent
  // a token. If no token was attached (e.g. public endpoint), a 401 is expected
  // and should NOT trigger a logout.
  if (response.status === 401 && !options.skipRefresh && hadToken) {
    // Refresh failed (expired/invalid). Force logout.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("session-expired"));
    }
    // Return the original 401 response instead of throwing to prevent unhandled rejection alerts
    return response;
  }

  return response;
}
