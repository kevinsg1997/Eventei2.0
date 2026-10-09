import { mapaCulturaProvider } from "./mapa-cultura.js";
import { subcenaProvider } from "./subcena.js";
import { ticketmasterProvider } from "./ticketmaster.js";
import type { EventProvider, NormalizedEvent } from "./types.js";

export const providers: EventProvider[] = [
  ticketmasterProvider,
  mapaCulturaProvider,
  subcenaProvider,
];

export async function fetchAllProviderEvents(): Promise<NormalizedEvent[]> {
  const batches = await Promise.all(
    providers.map(async (provider) => {
      try {
        return await provider.fetchBrazilEvents();
      } catch (error) {
        console.error(`[provider:${provider.id}] failed`, error);
        return [];
      }
    }),
  );

  return batches.flat();
}

export function providerStatus() {
  return providers.map((p) => ({
    id: p.id,
    label: p.label,
    configured: p.configured,
  }));
}
