import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import { adminRoutes } from "./routes/admin.js";
import { calendarRoutes } from "./routes/calendar.js";
import { eventRoutes } from "./routes/events.js";
import { favoriteRoutes } from "./routes/favorites.js";
import { reportRoutes } from "./routes/reports.js";
import { syncProviderEvents } from "./services/sync-events.js";

const port = Number(process.env.PORT ?? 4000);
const webUrl = process.env.WEB_URL ?? "http://localhost:3000";
const syncIntervalMs = Number(process.env.PROVIDER_SYNC_INTERVAL_MS ?? 0);

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: [webUrl],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });

  // Better Auth needs the raw request stream; Fastify must not pre-parse JSON here.
  await app.register(async (authApp) => {
    authApp.removeAllContentTypeParsers();
    authApp.addContentTypeParser(
      "*",
      (_request, payload, done) => {
        done(null, payload);
      },
    );

    const authHandler = toNodeHandler(auth);

    authApp.all("/api/auth/*", async (request, reply) => {
      reply.hijack();
      await authHandler(request.raw, reply.raw);
    });
  });

  app.get("/health", async () => ({
    ok: true,
    service: "eventei-api",
    phase: 2,
  }));

  await app.register(eventRoutes);
  await app.register(favoriteRoutes);
  await app.register(calendarRoutes);
  await app.register(reportRoutes);
  await app.register(adminRoutes);

  await app.listen({ port, host: "0.0.0.0" });
  console.log(`Eventei API listening on http://localhost:${port}`);

  // Optional periodic sync (set PROVIDER_SYNC_INTERVAL_MS, e.g. 3600000).
  if (syncIntervalMs > 0) {
    const runSync = async () => {
      try {
        const result = await syncProviderEvents();
        app.log.info(
          { upserted: result.upserted, summaries: result.summaries },
          "provider sync completed",
        );
      } catch (error) {
        app.log.error(error, "provider sync failed");
      }
    };
    setTimeout(runSync, 5_000);
    setInterval(runSync, syncIntervalMs);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
