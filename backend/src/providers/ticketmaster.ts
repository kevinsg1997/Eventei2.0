import { fetchJson, ProviderHttpError } from "./http.js";
import {
  allowProviderStubs,
  type EventProvider,
  type NormalizedEvent,
  type ProviderFetchResult,
} from "./types.js";

const DISCOVERY_URL = "https://app.ticketmaster.com/discovery/v2/events.json";
const MAX_PAGES = Number(process.env.TICKETMASTER_MAX_PAGES ?? 5);
const PAGE_SIZE = Number(process.env.TICKETMASTER_PAGE_SIZE ?? 50);

type TicketmasterEvent = {
  id: string;
  name?: string;
  info?: string;
  pleaseNote?: string;
  url?: string;
  dates?: {
    start?: { dateTime?: string; localDate?: string; localTime?: string };
    end?: { dateTime?: string };
  };
  priceRanges?: Array<{ min?: number; max?: number; currency?: string }>;
  images?: Array<{ url?: string; width?: number; ratio?: string }>;
  classifications?: Array<{
    segment?: { name?: string };
    genre?: { name?: string };
  }>;
  _embedded?: {
    venues?: Array<{
      name?: string;
      city?: { name?: string };
      state?: { stateCode?: string; name?: string };
      country?: { countryCode?: string };
      address?: { line1?: string };
    }>;
  };
};

type TicketmasterResponse = {
  page?: { totalPages?: number; number?: number };
  _embedded?: { events?: TicketmasterEvent[] };
};

function apiKey() {
  return (
    process.env.TICKETMASTER_API_KEY?.trim() ||
    process.env.TICKETMASTER_CONSUMER_KEY?.trim() ||
    ""
  );
}

export const ticketmasterProvider: EventProvider = {
  id: "ticketmaster",
  label: "Ticketmaster",
  get configured() {
    return Boolean(apiKey());
  },
  async fetchBrazilEvents(): Promise<ProviderFetchResult> {
    const key = apiKey();
    if (!key) {
      if (allowProviderStubs()) {
        return { events: demoTicketmasterEvents(), mode: "stub" };
      }
      return {
        events: [],
        mode: "unavailable",
        error: "TICKETMASTER_API_KEY (Consumer Key) não configurada",
      };
    }

    try {
      const events = await fetchAllBrazilPages(key);
      return { events, mode: "live" };
    } catch (error) {
      const message =
        error instanceof ProviderHttpError
          ? `${error.message}: ${error.bodyPreview}`
          : error instanceof Error
            ? error.message
            : "Erro Ticketmaster";

      if (allowProviderStubs()) {
        console.warn(`[ticketmaster] falling back to stub: ${message}`);
        return { events: demoTicketmasterEvents(), mode: "stub", error: message };
      }

      return { events: [], mode: "unavailable", error: message };
    }
  },
};

async function fetchAllBrazilPages(key: string): Promise<NormalizedEvent[]> {
  const collected: NormalizedEvent[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < Math.min(totalPages, MAX_PAGES)) {
    const url = new URL(DISCOVERY_URL);
    url.searchParams.set("apikey", key);
    url.searchParams.set("countryCode", "BR");
    url.searchParams.set("size", String(PAGE_SIZE));
    url.searchParams.set("page", String(page));
    url.searchParams.set("sort", "date,asc");

    const data = await fetchJson<TicketmasterResponse>(url.toString());
    totalPages = data.page?.totalPages ?? 1;
    const batch = data._embedded?.events ?? [];
    for (const item of batch) {
      const normalized = mapTicketmasterEvent(item);
      if (normalized) collected.push(normalized);
    }
    page += 1;
  }

  return collected;
}

function mapTicketmasterEvent(item: TicketmasterEvent): NormalizedEvent | null {
  if (!item.id || !item.name) return null;

  const venue = item._embedded?.venues?.[0];
  const startsAt = resolveStart(item);
  if (!startsAt) return null;

  const price = item.priceRanges?.[0];
  const isFree = Boolean(price && price.min === 0 && (price.max === 0 || price.max == null));
  const priceLabel = formatPrice(price, isFree);
  const imageUrl =
    pickImage(item.images) ??
    null;
  const category =
    item.classifications?.[0]?.genre?.name ||
    item.classifications?.[0]?.segment?.name ||
    "Shows";

  return {
    externalId: item.id,
    title: item.name,
    description: item.info || item.pleaseNote || "Evento Ticketmaster no Brasil.",
    startsAt,
    endsAt: item.dates?.end?.dateTime ?? null,
    city: venue?.city?.name || "Brasil",
    state: venue?.state?.stateCode || venue?.state?.name || null,
    country: venue?.country?.countryCode || "BR",
    address: venue?.address?.line1 || null,
    venueName: venue?.name || null,
    category,
    imageUrl,
    isFree,
    priceLabel,
    externalUrl: item.url || "https://www.ticketmaster.com.br",
    source: "ticketmaster",
  };
}

function resolveStart(item: TicketmasterEvent): string | null {
  if (item.dates?.start?.dateTime) return item.dates.start.dateTime;
  const localDate = item.dates?.start?.localDate;
  if (!localDate) return null;
  const localTime = item.dates?.start?.localTime || "20:00:00";
  return new Date(`${localDate}T${localTime}`).toISOString();
}

function formatPrice(
  price?: { min?: number; max?: number; currency?: string },
  isFree?: boolean,
): string {
  if (isFree) return "Gratuito";
  if (!price || price.min == null) return "Consultar na Ticketmaster";
  const currency = price.currency === "BRL" || !price.currency ? "R$" : price.currency;
  if (price.max != null && price.max !== price.min) {
    return `A partir de ${currency} ${Math.round(price.min)}`;
  }
  return `${currency} ${Math.round(price.min)}`;
}

function pickImage(images?: Array<{ url?: string; width?: number; ratio?: string }>) {
  if (!images?.length) return null;
  const preferred =
    images.find((img) => img.ratio === "16_9" && (img.width ?? 0) >= 1024) ||
    images.find((img) => img.ratio === "16_9") ||
    images[0];
  return preferred?.url ?? null;
}

function demoTicketmasterEvents(): NormalizedEvent[] {
  const inDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(20, 0, 0, 0);
    return d.toISOString();
  };

  return [
    {
      externalId: "tm-demo-sao-paulo-1",
      title: "Noite Indie ao Vivo — São Paulo",
      description:
        "Evento demonstrativo da integração Ticketmaster (stub). Ingressos na plataforma oficial.",
      startsAt: inDays(12),
      city: "São Paulo",
      state: "SP",
      country: "BR",
      venueName: "Arena Demo SP",
      category: "Shows",
      imageUrl: null,
      isFree: false,
      priceLabel: "A partir de R$ 120",
      externalUrl: "https://www.ticketmaster.com.br",
      source: "ticketmaster",
    },
    {
      externalId: "tm-demo-rio-1",
      title: "Festival Costa — Rio de Janeiro",
      description: "Stub Ticketmaster para o MVP. Link externo para compra.",
      startsAt: inDays(20),
      city: "Rio de Janeiro",
      state: "RJ",
      country: "BR",
      venueName: "Parque Demo RJ",
      category: "Festivais",
      imageUrl: null,
      isFree: false,
      priceLabel: "A partir de R$ 90",
      externalUrl: "https://www.ticketmaster.com.br",
      source: "ticketmaster",
    },
  ];
}
