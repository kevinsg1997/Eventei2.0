import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAdmin } from "../lib/session.js";

const resolveSchema = z.object({
  action: z.enum(["accept", "reject"]),
  resolution: z.string().max(1000).optional().nullable(),
  banAuthor: z.boolean().optional(),
});

export async function adminRoutes(app: FastifyInstance) {
  app.get("/admin/pendencias/denuncias", async (request, reply) => {
    try {
      await requireAdmin(request);

      const reports = await prisma.report.findMany({
        where: { status: "pending" },
        include: {
          event: true,
          reporter: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      });

      return { reports };
    } catch (error) {
      return sendError(reply, error);
    }
  });

  app.post("/admin/pendencias/denuncias/:id/resolve", async (request, reply) => {
    try {
      const admin = await requireAdmin(request);
      const { id } = request.params as { id: string };
      const body = resolveSchema.parse(request.body);

      const report = await prisma.report.findUnique({
        where: { id },
        include: { event: true },
      });

      if (!report || report.status !== "pending") {
        return reply.status(404).send({ error: "Denúncia não encontrada" });
      }

      if (body.action === "reject") {
        const updated = await prisma.report.update({
          where: { id },
          data: {
            status: "rejected",
            resolvedAt: new Date(),
            resolvedById: admin.id,
            resolution: body.resolution ?? "Denúncia rejeitada",
          },
        });
        return { report: updated };
      }

      const shouldBan =
        body.banAuthor ??
        report.reason === "Evento precisa de compra de ingresso";

      const result = await prisma.$transaction(async (tx) => {
        const updatedReport = await tx.report.update({
          where: { id },
          data: {
            status: "accepted",
            resolvedAt: new Date(),
            resolvedById: admin.id,
            resolution: body.resolution ?? "Denúncia aceita",
          },
        });

        await tx.event.update({
          where: { id: report.eventId },
          data: { published: false },
        });

        if (shouldBan && report.event.authorId) {
          await tx.user.update({
            where: { id: report.event.authorId },
            data: {
              status: "banned",
              bannedAt: new Date(),
              banReason:
                body.resolution ??
                `Denúncia aceita: ${report.reason}`,
            },
          });

          await tx.session.deleteMany({
            where: { userId: report.event.authorId },
          });
        }

        return updatedReport;
      });

      return { report: result };
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
