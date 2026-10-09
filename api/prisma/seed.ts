import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

async function main() {
  const password = await hashPassword("Admin123!");

  const admin = await prisma.user.upsert({
    where: { email: "admin@eventei.local" },
    update: {
      role: "admin",
      status: "active",
      name: "Admin Eventei",
    },
    create: {
      email: "admin@eventei.local",
      name: "Admin Eventei",
      emailVerified: true,
      role: "admin",
      status: "active",
    },
  });

  await prisma.account.upsert({
    where: { id: "seed-admin-credential" },
    update: { password },
    create: {
      id: "seed-admin-credential",
      accountId: admin.id,
      providerId: "credential",
      userId: admin.id,
      password,
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@eventei.local" },
    update: { status: "active", role: "user" },
    create: {
      email: "demo@eventei.local",
      name: "Usuário Demo",
      emailVerified: true,
      role: "user",
      status: "active",
    },
  });

  const demoPassword = await hashPassword("Demo1234!");
  await prisma.account.upsert({
    where: { id: "seed-demo-credential" },
    update: { password: demoPassword },
    create: {
      id: "seed-demo-credential",
      accountId: demoUser.id,
      providerId: "credential",
      userId: demoUser.id,
      password: demoPassword,
    },
  });

  console.log("Seed OK");
  console.log("Admin: admin@eventei.local / Admin123!");
  console.log("Demo:  demo@eventei.local / Demo1234!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
