export type ProviderId = "ticketmaster" | "mapa_cultura" | "subcena";

export type NormalizedEvent = {
  externalId: string;
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
  source: ProviderId;
};

export type ProviderFetchResult = {
  events: NormalizedEvent[];
  mode: "live" | "stub" | "unavailable";
  error?: string;
};

export type EventProvider = {
  id: ProviderId;
  label: string;
  configured: boolean;
  fetchBrazilEvents: () => Promise<ProviderFetchResult>;
};

export function allowProviderStubs() {
  return process.env.ALLOW_PROVIDER_STUBS !== "false";
}
