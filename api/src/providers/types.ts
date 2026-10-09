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
  source: "ticketmaster" | "mapa_cultura" | "subcena";
};

export type EventProvider = {
  id: NormalizedEvent["source"];
  label: string;
  configured: boolean;
  fetchBrazilEvents: () => Promise<NormalizedEvent[]>;
};
