import { mapaCulturaProvider } from "./mapa-cultura.js";
import { subcenaProvider } from "./subcena.js";
import { ticketmasterProvider } from "./ticketmaster.js";
import type {
  EventProvider,
  NormalizedEvent,
  ProviderFetchResult,
  ProviderId,
} from "./types.js";

export const providers: EventProvider[] = [
  ticketmasterProvider,
  mapaCulturaProvider,
  subcenaProvider,
];

export type ProviderSyncSummary = {
  id: ProviderId;
  label: string;
  configured: boolean;
  mode: ProviderFetchResult["mode"];
  count: number;
  error?: string;
};

export async function fetchAllProviderEvents(): Promise<{
  events: NormalizedEvent[];
  summaries: ProviderSyncSummary[];
}> {
  const summaries: ProviderSyncSummary[] = [];
  const batches = await Promise.all(
    providers.map(async (provider) => {
      try {
        const result = await provider.fetchBrazilEvents();
        summaries.push({
          id: provider.id,
          label: provider.label,
          configured: provider.configured,
          mode: result.mode,
          count: result.events.length,
          error: result.error,
        });
        return result.events;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";
        console.error(`[provider:${provider.id}] failed`, error);
        summaries.push({
          id: provider.id,
          label: provider.label,
          configured: provider.configured,
          mode: "unavailable",
          count: 0,
          error: message,
        });
        return [];
      }
    }),
  );

  return { events: batches.flat(), summaries };
}

export function providerStatus() {
  return providers.map((p) => ({
    id: p.id,
    label: p.label,
    configured: p.configured,
  }));
}
