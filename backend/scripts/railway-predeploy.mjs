import { spawnSync } from "node:child_process";

function run(command, args) {
  console.log(`\n[railway:predeploy] $ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: false,
  });
  if (result.error) {
    console.error(`[railway:predeploy] failed to start: ${result.error.message}`);
    process.exit(1);
  }
  return result.status ?? 1;
}

function requireEnv(name) {
  if (!process.env[name]) {
    console.error(`[railway:predeploy] missing required env: ${name}`);
    process.exit(1);
  }
}

console.log("[railway:predeploy] cwd=", process.cwd());
console.log("[railway:predeploy] node=", process.version);
requireEnv("DATABASE_URL");

if (run("npx", ["prisma", "generate"]) !== 0) {
  process.exit(1);
}

if (run("npx", ["prisma", "migrate", "deploy"]) !== 0) {
  process.exit(1);
}

const seedStatus = run("npx", ["tsx", "prisma/seed.ts"]);
if (seedStatus !== 0) {
  console.warn(
    "[railway:predeploy] seed failed (non-fatal). API will still start. Fix seed later if needed.",
  );
}

console.log("[railway:predeploy] done");
