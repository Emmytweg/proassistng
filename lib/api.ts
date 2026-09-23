export const API_ENDPOINTS = {
  contactNotification: "/api/notify-contact",
  enquiryNotification: "/api/notify-enquiry",
  hireNotification: "/api/notify-hire",
  reply: "/api/send-reply",
  subscribe: "/api/subscribe",
  workspaceMagicLink: "/api/workspace/magic-link",
  turnCredentials: "/api/turn-credentials",
} as const;

export async function readApiError(response: Response, fallback: string) {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error || fallback;
  } catch {
    return fallback;
  }
}
