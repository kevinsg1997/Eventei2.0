import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";

export async function favoriteRoutes(app: FastifyInstance) {
  app.get("/favorites", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const favorites = await prisma.favorite.findMany({
        where: { userId: user.id },
        include: { event: true },
        orderBy: { createdAt: "desc" },
      });
      return { favorites };
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post("/favorites/:eventId", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const { eventId } = request.params as { eventId: string };

      const event = await prisma.event.findFirst({
        where: { id: eventId, published: true },
      });
      if (!event) {
        return reply.status(404).send({ error: "Evento não encontrado" });
      }

      const favorite = await prisma.favorite.upsert({
        where: { userId_eventId: { userId: user.id, eventId } },
        create: { userId: user.id, eventId },
        update: {},
      });

      return reply.status(201).send({ favorite });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.delete("/favorites/:eventId", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const { eventId } = request.params as { eventId: string };

      await prisma.favorite.deleteMany({
        where: { userId: user.id, eventId },
      });

      return reply.status(204).send();
    } catch (error) {
      return sendError(reply, error);
    }
  });
}

function sendError(reply: import("fastify").FastifyReply, error: unknown) {
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
