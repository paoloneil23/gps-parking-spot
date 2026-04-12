export const getApiBase = () => {
  const rawBase = (import.meta.env.VITE_API_URL || "").toString().trim();

  if (!rawBase || rawBase === "/") {
    return "http://localhost:5000";
  }

  try {
    const parsed = new URL(rawBase);
    const frontendDevPorts = new Set(["5173", "4173", "3000"]);

    if (
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
      frontendDevPorts.has(parsed.port)
    ) {
      return "http://localhost:5000";
    }
  } catch {
    // If env value is malformed, fall back to the known backend URL.
    return "http://localhost:5000";
  }

  return rawBase.replace(/\/+$/, "");
};

export const parseResponseSafely = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.toLowerCase().includes("application/json")) {
    return response.json();
  }

  const rawBody = await response.text();
  const message =
    rawBody && rawBody.trim().startsWith("<!DOCTYPE")
      ? "API returned HTML instead of JSON. Check that backend is running and VITE_API_URL points to it."
      : rawBody || "Unexpected response format from server.";

  throw new Error(message);
};
