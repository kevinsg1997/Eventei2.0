import assert from "node:assert/strict";
import { ticketmasterProvider } from "./ticketmaster.js";

async function main() {
  process.env.ALLOW_PROVIDER_STUBS = "true";
  delete process.env.TICKETMASTER_API_KEY;
  delete process.env.TICKETMASTER_CONSUMER_KEY;

  const result = await ticketmasterProvider.fetchBrazilEvents();
  assert.equal(result.mode, "stub");
  assert.ok(result.events.length >= 1);
  assert.equal(result.events[0]?.source, "ticketmaster");
  assert.equal(result.events[0]?.country, "BR");

  console.log("ticketmaster.test.ts OK");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
