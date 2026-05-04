const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export async function getAuthHeaders(contentType: string | null = "application/json"): Promise<HeadersInit> {
  const headers: HeadersInit = {};

  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const incomingHeaders = options.headers instanceof Headers
    ? Object.fromEntries(options.headers.entries())
    : (options.headers as Record<string, string> | undefined) || {};

  const hasExplicitContentType = Object.keys(incomingHeaders).some((key) => key.toLowerCase() === "content-type");
  const defaultContentType = options.body instanceof FormData || hasExplicitContentType ? null : "application/json";

  const headers = {
    ...(await getAuthHeaders(defaultContentType)),
    ...incomingHeaders,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

export { API_BASE_URL };
