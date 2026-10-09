import type { EventProvider, NormalizedEvent } from "./types.js";

/** Stub for Mapa da Cultura (public API — wired in Phase 2). */
export const mapaCulturaProvider: EventProvider = {
  id: "mapa_cultura",
  label: "Mapa da Cultura",
  configured: true,
  async fetchBrazilEvents() {
    const inDays = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      d.setHours(15, 0, 0, 0);
      return d.toISOString();
    };

    return [
      {
        externalId: "mc-demo-curitiba-1",
        title: "Sarau Livre no Parque — Curitiba",
        description:
          "Evento cultural gratuito (stub Mapa da Cultura). Integração completa na Fase 2.",
        startsAt: inDays(5),
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
    ] satisfies NormalizedEvent[];
  },
};
