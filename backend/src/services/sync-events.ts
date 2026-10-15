import { prisma } from "../lib/prisma.js";
import {
  fetchAllProviderEvents,
  type ProviderSyncSummary,
} from "../providers/index.js";

export async function syncProviderEvents(): Promise<{
  upserted: number;
  summaries: ProviderSyncSummary[];
}> {
  const { events, summaries } = await fetchAllProviderEvents();
  let upserted = 0;

  for (const item of events) {
    await prisma.event.upsert({
      where: {
        source_externalId: {
          source: item.source,
          externalId: item.externalId,
        },
      },
      create: {
        title: item.title,
        description: item.description,
        startsAt: new Date(item.startsAt),
        endsAt: item.endsAt ? new Date(item.endsAt) : null,
        city: item.city,
        state: item.state ?? null,
        country: item.country,
        address: item.address ?? null,
        venueName: item.venueName ?? null,
        category: item.category ?? null,
        imageUrl: item.imageUrl ?? null,
        isFree: item.isFree,
        priceLabel: item.priceLabel ?? null,
        externalUrl: item.externalUrl ?? null,
        source: item.source,
        externalId: item.externalId,
        published: true,
      },
      update: {
        title: item.title,
        description: item.description,
        startsAt: new Date(item.startsAt),
        endsAt: item.endsAt ? new Date(item.endsAt) : null,
        city: item.city,
        state: item.state ?? null,
        address: item.address ?? null,
        venueName: item.venueName ?? null,
        category: item.category ?? null,
        imageUrl: item.imageUrl ?? null,
        isFree: item.isFree,
        priceLabel: item.priceLabel ?? null,
        externalUrl: item.externalUrl ?? null,
        published: true,
      },
    });
    upserted += 1;
  }

  return { upserted, summaries };
}
