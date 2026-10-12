import type { FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth, type SessionUser } from "./auth.js";

export async function getSessionUser(
  request: FastifyRequest,
): Promise<SessionUser | null> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireUser(request: FastifyRequest): Promise<SessionUser> {
  const user = await getSessionUser(request);
  if (!user) {
    throw Object.assign(new Error("Não autenticado"), { statusCode: 401 });
  }
  if (user.status === "banned") {
    throw Object.assign(new Error("Conta banida"), { statusCode: 403 });
  }
  return user;
}

export async function requireAdmin(request: FastifyRequest): Promise<SessionUser> {
  const user = await requireUser(request);
  if (user.role !== "admin") {
    throw Object.assign(new Error("Acesso negado"), { statusCode: 404 });
  }
  return user;
}
