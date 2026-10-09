/** Browser calls same-origin proxy; server can hit the API directly. */
function getApiBase() {
  if (typeof window !== "undefined") {
    return "/backend";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export type ApiEvent = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt?: string | null;
  city: string;
  state?: string | null;
  country: string;
  address?: string | null;
  venueName?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  isFree: boolean;
  priceLabel?: string | null;
  externalUrl?: string | null;
  source: "user" | "ticketmaster" | "mapa_cultura" | "subcena";
  authorId?: string | null;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    let message = "Falha na requisição";
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  health: () => apiFetch<{ ok: boolean }>("/health"),
  listEvents: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return apiFetch<{ events: ApiEvent[] }>(`/events${qs}`);
  },
  getEvent: (id: string) => apiFetch<{ event: ApiEvent }>(`/events/${id}`),
  syncProviders: () =>
    apiFetch<{ upserted: number }>("/providers/sync", { method: "POST" }),
  listFavorites: () =>
    apiFetch<{ favorites: { id: string; event: ApiEvent }[] }>("/favorites"),
  addFavorite: (eventId: string) =>
    apiFetch(`/favorites/${eventId}`, { method: "POST" }),
  removeFavorite: (eventId: string) =>
    apiFetch(`/favorites/${eventId}`, { method: "DELETE" }),
  listCalendar: () =>
    apiFetch<{ entries: { id: string; event: ApiEvent }[] }>("/calendar"),
  addCalendar: (eventId: string) =>
    apiFetch(`/calendar/${eventId}`, { method: "POST" }),
  removeCalendar: (eventId: string) =>
    apiFetch(`/calendar/${eventId}`, { method: "DELETE" }),
  reportReasons: () => apiFetch<{ reasons: string[] }>("/reports/reasons"),
  createReport: (eventId: string, reason: string, details?: string) =>
    apiFetch(`/events/${eventId}/reports`, {
      method: "POST",
      body: JSON.stringify({ reason, details }),
    }),
  adminPendingReports: () =>
    apiFetch<{
      reports: Array<{
        id: string;
        reason: string;
        details?: string | null;
        createdAt: string;
        event: ApiEvent;
        reporter: { id: string; name: string; email: string };
      }>;
    }>("/admin/pendencias/denuncias"),
  resolveReport: (
    id: string,
    action: "accept" | "reject",
    resolution?: string,
  ) =>
    apiFetch(`/admin/pendencias/denuncias/${id}/resolve`, {
      method: "POST",
      body: JSON.stringify({ action, resolution }),
    }),
  createEvent: (payload: Record<string, unknown>) =>
    apiFetch<{ event: ApiEvent }>("/events", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/** Public origin used by Better Auth client (same-origin via Next rewrite). */
export const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3001";
