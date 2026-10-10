import { fetchJson, ProviderHttpError } from "./http.js";
import {
  allowProviderStubs,
  type EventProvider,
  type NormalizedEvent,
  type ProviderFetchResult,
} from "./types.js";

const BASE = "https://subcena.com/api/v1";

type SubcenaCity = { id: string; name: string };
type SubcenaEvent = {
  id: string;
  slug?: string;
  name: string;
  tag?: string;
  startsAt?: number;
  startTime?: string;
  endTime?: string;
  url?: string;
  city?: string;
  location?: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
};

const CITY_STATE: Record<string, { city: string; state: string }> = {
  belo_horizonte: { city: "Belo Horizonte", state: "MG" },
  rio_de_janeiro: { city: "Rio de Janeiro", state: "RJ" },
  sao_paulo: { city: "São Paulo", state: "SP" },
  bh: { city: "Belo Horizonte", state: "MG" },
  rio: { city: "Rio de Janeiro", state: "RJ" },
  sp: { city: "São Paulo", state: "SP" },
};

export const subcenaProvider: EventProvider = {
  id: "subcena",
  label: "Subcena",
  configured: true,
  async fetchBrazilEvents(): Promise<ProviderFetchResult> {
    try {
      const cities = await fetchJson<{ data: SubcenaCity[] }>(`${BASE}/cities`);
      const cityIds = (cities.data ?? []).map((c) => c.id);
      const targets = cityIds.length
        ? cityIds
        : ["belo_horizonte", "rio_de_janeiro", "sao_paulo"];

      const batches = await Promise.all(
        targets.map(async (cityId) => {
          const payload = await fetchJson<{ data: SubcenaEvent[] }>(
            `${BASE}/events?city=${encodeURIComponent(cityId)}`,
          );
          return (payload.data ?? [])
            .map((item) => mapSubcenaEvent(item, cityId))
            .filter((item): item is NormalizedEvent => Boolean(item));
        }),
      );

      return { events: batches.flat(), mode: "live" };
    } catch (error) {
      const message =
        error instanceof ProviderHttpError
          ? `${error.message}: ${error.bodyPreview}`
          : error instanceof Error
            ? error.message
            : "Erro Subcena";

      if (allowProviderStubs()) {
        return { events: demoSubcenaEvents(), mode: "stub", error: message };
      }
      return { events: [], mode: "unavailable", error: message };
    }
  },
};

function mapSubcenaEvent(
  item: SubcenaEvent,
  cityId: string,
): NormalizedEvent | null {
  if (!item.id || !item.name || !item.startsAt) return null;
  const place = CITY_STATE[item.city || cityId] || CITY_STATE[cityId] || {
    city: item.city || cityId,
    state: null,
  };

  return {
    externalId: item.id,
    title: item.name,
    description: item.tag
      ? `Evento Subcena · ${item.tag}`
      : "Evento listado na Subcena.",
    startsAt: new Date(item.startsAt).toISOString(),
    endsAt: null,
    city: place.city,
    state: place.state,
    country: "BR",
    address: item.location?.address || null,
    venueName: item.location?.name || null,
    category: item.tag || "Shows",
    imageUrl: null,
    isFree: false,
    priceLabel: "Consultar na fonte",
    externalUrl: item.url || `https://subcena.com/event/${item.slug || item.id}`,
    source: "subcena",
  };
}

function demoSubcenaEvents(): NormalizedEvent[] {
  const inDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(19, 30, 0, 0);
    return d.toISOString();
  };

  return [
    {
      externalId: "sc-demo-bh-1",
      title: "Circuito Underground — Belo Horizonte",
      description: "Stub Subcena (BH/SP/RJ).",
      startsAt: inDays(9),
      city: "Belo Horizonte",
      state: "MG",
      country: "BR",
      venueName: "Casa Demo BH",
      category: "Baladas",
      imageUrl: null,
      isFree: false,
      priceLabel: "Consultar na fonte",
      externalUrl: "https://subcena.com",
      source: "subcena",
    },
  ];
}
