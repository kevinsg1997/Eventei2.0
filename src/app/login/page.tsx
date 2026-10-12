"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const result = await signIn.email({ email, password });
    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Não foi possível entrar");
      return;
    }

    router.push("/conta");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16 md:px-6">
      <div>
        <h1 className="display text-4xl font-bold">Entrar</h1>
        <p className="muted mt-2">Acesse favoritos, calendário e publicações.</p>
      </div>

      <form onSubmit={onSubmit} className="panel space-y-4 p-6">
        <label className="field">
          <span>E-mail</span>
          <input name="email" type="email" required placeholder="voce@email.com" />
        </label>
        <label className="field">
          <span>Senha</span>
          <input name="password" type="password" required minLength={8} />
        </label>
        {error && <p className="text-sm text-[var(--accent)]">{error}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="panel space-y-3 p-6">
        <p className="text-sm font-medium">Ou continue com</p>
        <SocialAuthButtons />
      </div>

      <p className="muted text-sm">
        Não tem conta?{" "}
        <Link href="/register" className="text-[var(--accent-2)]">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
