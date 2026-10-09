import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";

export async function calendarRoutes(app: FastifyInstance) {
  app.get("/calendar", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const entries = await prisma.calendarEntry.findMany({
        where: { userId: user.id },
        include: { event: true },
        orderBy: { event: { startsAt: "asc" } },
      });
      return { entries };
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post("/calendar/:eventId", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const { eventId } = request.params as { eventId: string };

      const event = await prisma.event.findFirst({
        where: { id: eventId, published: true },
      });
      if (!event) {
        return reply.status(404).send({ error: "Evento não encontrado" });
      }

      const entry = await prisma.calendarEntry.upsert({
        where: { userId_eventId: { userId: user.id, eventId } },
        create: { userId: user.id, eventId },
        update: {},
      });

      return reply.status(201).send({ entry });
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.delete("/calendar/:eventId", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const { eventId } = request.params as { eventId: string };

      await prisma.calendarEntry.deleteMany({
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
