import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireUser } from "../lib/session.js";

export const REPORT_REASONS = [
  "Evento precisa de compra de ingresso",
  "Conteúdo enganoso ou spam",
  "Informações falsas de local/data",
  "Conteúdo ofensivo",
  "Outro",
] as const;

const createReportSchema = z.object({
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(2000).optional().nullable(),
});

export async function reportRoutes(app: FastifyInstance) {
  app.get("/reports/reasons", async () => ({ reasons: REPORT_REASONS }));

  app.post("/events/:eventId/reports", async (request, reply) => {
    try {
      const user = await requireUser(request);
      const { eventId } = request.params as { eventId: string };
      const body = createReportSchema.parse(request.body);

      const event = await prisma.event.findFirst({
        where: { id: eventId, published: true },
      });

      if (!event) {
        return reply.status(404).send({ error: "Evento não encontrado" });
      }

      if (event.source !== "user") {
        return reply.status(400).send({
          error:
            "Denúncias só são permitidas em eventos cadastrados na plataforma.",
        });
      }

      const existing = await prisma.report.findFirst({
        where: {
          eventId,
          reporterId: user.id,
          status: "pending",
        },
      });

      if (existing) {
        return reply.status(409).send({
          error: "Você já tem uma denúncia pendente para este evento.",
        });
      }

      const report = await prisma.report.create({
        data: {
          eventId,
          reporterId: user.id,
          reason: body.reason,
          details: body.details ?? null,
        },
      });

      return reply.status(201).send({ report });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({ error: "Dados inválidos", details: error.flatten() });
      }
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
