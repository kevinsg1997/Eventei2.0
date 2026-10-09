import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma.js";

const webUrl = process.env.WEB_URL ?? "http://localhost:3000";

function optionalSocialProviders() {
  const providers: Record<string, { clientId: string; clientSecret: string; appBundleIdentifier?: string }> = {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    providers.facebook = {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    };
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
  }

  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
    providers.apple = {
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
      appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER,
    };
  }

  return providers;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:4000",
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [webUrl],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: optionalSocialProviders(),
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
        required: false,
      },
      status: {
        type: "string",
        defaultValue: "active",
        input: false,
        required: false,
      },
      bannedAt: {
        type: "date",
        required: false,
        input: false,
      },
      banReason: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { status: true, banReason: true },
          });

          if (user?.status === "banned") {
            throw new Error(
              user.banReason
                ? `Conta banida: ${user.banReason}`
                : "Conta banida. Entre em contato com o suporte.",
            );
          }

          return { data: session };
        },
      },
    },
  },
});

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role?: string;
  status?: string;
};
