import type { EventProvider, NormalizedEvent } from "./types.js";

/** Stub until TICKETMASTER_API_KEY is configured. */
export const ticketmasterProvider: EventProvider = {
  id: "ticketmaster",
  label: "Ticketmaster",
  configured: Boolean(process.env.TICKETMASTER_API_KEY),
  async fetchBrazilEvents() {
    if (!process.env.TICKETMASTER_API_KEY) {
      return demoTicketmasterEvents();
    }

    // Real integration lands in Phase 2.
    return demoTicketmasterEvents();
  },
};

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
