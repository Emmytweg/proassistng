import "server-only";

const DEFAULT_SITE_URL = "https://www.proassistng.com.ng";
const DEFAULT_METERED_API_URL = "https://proassistng.metered.live";
const DEFAULT_PAYSTACK_API_URL = "https://api.paystack.co";

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
}

export function getWorkspaceRedirectUrl(projectId?: string) {
  const configuredUrl = process.env.NEXT_PUBLIC_WORKSPACE_REDIRECT_URL;
  const redirectUrl = configuredUrl || `${getSiteUrl()}/workspace/redirect`;

  // Keep older deployments using /workspace compatible with the redirect page.
  const normalizedUrl = redirectUrl.replace(
    /\/workspace\/?$/,
    "/workspace/redirect",
  );
  return projectId
    ? `${normalizedUrl}${normalizedUrl.includes("?") ? "&" : "?"}project_id=${encodeURIComponent(projectId)}`
    : normalizedUrl;
}

export function getMeteredConfig() {
  return {
    apiUrl: process.env.METERED_API_URL || DEFAULT_METERED_API_URL,
    apiKey: process.env.METERED_API_KEY,
  };
}

export function getPaystackApiUrl() {
  return process.env.PAYSTACK_API_URL || DEFAULT_PAYSTACK_API_URL;
}
