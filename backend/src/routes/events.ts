import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";
import { providerStatus } from "../providers/index.js";
import { syncProviderEvents } from "../services/sync-events.js";

const createEventSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(5000).default(""),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional().nullable(),
  city: z.string().min(2).max(120),
  state: z.string().max(2).optional().nullable(),
  address: z.string().max(240).optional().nullable(),
  venueName: z.string().max(160).optional().nullable(),
  category: z.string().max(80).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  freeDeclaration: z.literal(true),
});

export async function eventRoutes(app: FastifyInstance) {
  app.get("/events", async (request) => {
    const query = request.query as {
      city?: string;
      q?: string;
      free?: string;
      category?: string;
    };

    const events = await prisma.event.findMany({
      where: {
        published: true,
        ...(query.city
          ? { city: { contains: query.city, mode: "insensitive" } }
          : {}),
        ...(query.category
          ? { category: { contains: query.category, mode: "insensitive" } }
          : {}),
        ...(query.free === "true" ? { isFree: true } : {}),
        ...(query.q
          ? {
              OR: [
                { title: { contains: query.q, mode: "insensitive" } },
                { description: { contains: query.q, mode: "insensitive" } },
                { city: { contains: query.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { startsAt: "asc" },
      take: 100,
    });

    return { events };
  });

  app.get("/events/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const event = await prisma.event.findFirst({
      where: { id, published: true },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    if (!event) {
      return reply.status(404).send({ error: "Evento não encontrado" });
    }

    return { event };
  });

  app.post("/events", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const body = createEventSchema.parse(request.body);

      const event = await prisma.event.create({
        data: {
          title: body.title,
          description: body.description,
          startsAt: new Date(body.startsAt),
          endsAt: body.endsAt ? new Date(body.endsAt) : null,
          city: body.city,
          state: body.state ?? null,
          address: body.address ?? null,
          venueName: body.venueName ?? null,
          category: body.category ?? null,
          imageUrl: body.imageUrl ?? null,
          isFree: true,
          priceLabel: "Gratuito",
          source: "user",
          authorId: user.id,
          published: true,
        },
      });

      return reply.status(201).send({ event });
    } catch (error) {
      return handleRouteError(reply, error);
    }
  });

  app.get("/providers/status", async () => ({ providers: providerStatus() }));

  app.post("/providers/sync", async (_request, reply) => {
    const { upserted, summaries } = await syncProviderEvents();
    return reply.send({
      upserted,
      providers: providerStatus(),
      summaries,
    });
  });
}

function handleRouteError(reply: import("fastify").FastifyReply, error: unknown) {
  if (error instanceof z.ZodError) {
    return reply.status(400).send({ error: "Dados inválidos", details: error.flatten() });
  }

  const statusCode =
    typeof error === "object" &&
    error &&
    "statusCode" in error &&
    typeof (error as { statusCode: unknown }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : 500;

  const message = error instanceof Error ? error.message : "Erro interno";
  return reply.status(statusCode).send({ error: message });
}
