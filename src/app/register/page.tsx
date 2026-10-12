"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { signUp } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const result = await signUp.email({ name, email, password });
    setLoading(false);

    if (result.error) {
      setError(result.error.message ?? "Não foi possível registrar");
      return;
    }

    router.push("/conta");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16 md:px-6">
      <div>
        <h1 className="display text-4xl font-bold">Criar conta</h1>
        <p className="muted mt-2">
          Publique eventos gratuitos e salve o que te interessa.
        </p>
      </div>

      <form onSubmit={onSubmit} className="panel space-y-4 p-6">
        <label className="field">
          <span>Nome</span>
          <input name="name" required placeholder="Seu nome" />
        </label>
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
          {loading ? "Criando..." : "Registrar"}
        </button>
      </form>

      <div className="panel space-y-3 p-6">
        <p className="text-sm font-medium">Ou continue com</p>
        <SocialAuthButtons />
      </div>

      <p className="muted text-sm">
        Já tem conta?{" "}
        <Link href="/login" className="text-[var(--accent-2)]">
          Entrar
        </Link>
      </p>
    </div>
  );
}
