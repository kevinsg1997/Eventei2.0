import { fetchJson, ProviderHttpError } from "./http.js";
import {
  allowProviderStubs,
  type EventProvider,
  type NormalizedEvent,
  type ProviderFetchResult,
} from "./types.js";

/** Official Mapas Culturais public API (may be Cloudflare-protected from some hosts). */
const ENDPOINTS = [
  "https://mapa.cultura.gov.br/api/event/find",
  "https://mapas.cultura.gov.br/api/event/find",
];

type MapaEvent = {
  id?: number | string;
  name?: string;
  shortDescription?: string;
  description?: string;
  longDescription?: string;
  classificacaoEtaria?: string;
  terms?: { tag?: string[]; linguagem?: string[] };
  occurrences?: Array<{
    rule?: string;
    space?: {
      name?: string;
      endereco?: string;
      En_Municipio?: string;
      En_Estado?: string;
    };
  }>;
};

export const mapaCulturaProvider: EventProvider = {
  id: "mapa_cultura",
  label: "Mapa da Cultura",
  configured: true,
  async fetchBrazilEvents(): Promise<ProviderFetchResult> {
    const params = new URLSearchParams({
      "@select":
        "id,name,shortDescription,longDescription,description,terms,classificacaoEtaria,occurrences.{rule,space.{name,endereco,En_Municipio,En_Estado}}",
      "@files": "(avatar):url",
      "@limit": "80",
      "@order": "id DESC",
    });

    let lastError = "Falha ao consultar Mapa da Cultura";

    for (const endpoint of ENDPOINTS) {
      try {
        const rows = await fetchJson<MapaEvent[]>(`${endpoint}?${params}`);
        if (!Array.isArray(rows)) {
          throw new Error("Formato inesperado da API");
        }
        const events = rows
          .map(mapMapaEvent)
          .filter((item): item is NormalizedEvent => Boolean(item));
        return { events, mode: "live" };
      } catch (error) {
        lastError =
          error instanceof ProviderHttpError
            ? `${error.message}: ${error.bodyPreview}`
            : error instanceof Error
              ? error.message
              : lastError;
      }
    }

    if (allowProviderStubs()) {
      return { events: demoMapaEvents(), mode: "stub", error: lastError };
    }
    return { events: [], mode: "unavailable", error: lastError };
  },
};

function mapMapaEvent(item: MapaEvent): NormalizedEvent | null {
  if (item.id == null || !item.name) return null;
  const occurrence = item.occurrences?.[0];
  const space = occurrence?.space;
  const startsAt = parseOccurrenceStart(occurrence?.rule) ?? daysFromNow(10);

  return {
    externalId: String(item.id),
    title: item.name,
    description:
      item.shortDescription ||
      item.description ||
      item.longDescription ||
      "Evento cultural (Mapa da Cultura).",
    startsAt,
    endsAt: null,
    city: space?.En_Municipio || "Brasil",
    state: space?.En_Estado || null,
    country: "BR",
    address: space?.endereco || null,
    venueName: space?.name || null,
    category: item.terms?.linguagem?.[0] || item.terms?.tag?.[0] || "Cultura",
    imageUrl: extractAvatarUrl(item),
    isFree: true,
    priceLabel: "Gratuito / consultar fonte",
    externalUrl: `https://mapa.cultura.gov.br/evento/${item.id}`,
    source: "mapa_cultura",
  };
}

function extractAvatarUrl(item: MapaEvent): string | null {
  const files = (item as Record<string, unknown>)["@files"] as
    | { avatar?: { url?: string } }
    | undefined;
  return files?.avatar?.url || null;
}

function parseOccurrenceStart(rule?: string): string | null {
  if (!rule) return null;
  // Examples: "2026-10-20 19:00", frequency rules, etc.
  const match = rule.match(
    /(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?/,
  );
  if (!match) return null;
  const time = match[2] ? (match[2].length === 5 ? `${match[2]}:00` : match[2]) : "19:00:00";
  const date = new Date(`${match[1]}T${time}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(15, 0, 0, 0);
  return d.toISOString();
}

function demoMapaEvents(): NormalizedEvent[] {
  return [
    {
      externalId: "mc-demo-curitiba-1",
      title: "Sarau Livre no Parque — Curitiba",
      description:
        "Evento cultural gratuito (stub Mapa da Cultura). A API oficial pode bloquear alguns IPs (Cloudflare).",
      startsAt: daysFromNow(5),
      city: "Curitiba",
      state: "PR",
      country: "BR",
      venueName: "Parque Barigui",
      category: "Cultura",
      imageUrl: null,
      isFree: true,
      priceLabel: "Gratuito",
      externalUrl: "https://mapa.cultura.gov.br",
      source: "mapa_cultura",
    },
  ];
}
