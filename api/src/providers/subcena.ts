import type { EventProvider, NormalizedEvent } from "./types.js";

/** Stub for Subcena public API — wired in Phase 2. */
export const subcenaProvider: EventProvider = {
  id: "subcena",
  label: "Subcena",
  configured: true,
  async fetchBrazilEvents() {
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
        description: "Stub Subcena (BH/SP/RJ). Sync real na Fase 2.",
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
    ] satisfies NormalizedEvent[];
  },
};
