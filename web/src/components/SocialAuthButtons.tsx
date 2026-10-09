"use client";

import { signIn } from "@/lib/auth-client";

const providers = [
  { id: "google" as const, label: "Google" },
  { id: "facebook" as const, label: "Facebook" },
  { id: "github" as const, label: "GitHub" },
  { id: "apple" as const, label: "Apple" },
];

export function SocialAuthButtons() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {providers.map((provider) => (
        <button
          key={provider.id}
          type="button"
          className="btn btn-ghost w-full"
          onClick={() =>
            signIn.social({
              provider: provider.id,
              callbackURL: `${window.location.origin}/conta`,
            })
          }
        >
          Continuar com {provider.label}
        </button>
      ))}
      <p className="muted col-span-full text-xs">
        OAuth fica ativo quando as Client IDs/Secrets estiverem configuradas na
        API. Sem elas, use e-mail e senha.
      </p>
    </div>
  );
}
