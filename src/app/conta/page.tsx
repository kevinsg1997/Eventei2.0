"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { signOut, useSession } from "@/lib/auth-client";

export default function ContaPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const user = session?.user as
    | {
        name?: string;
        email?: string;
        role?: string;
        status?: string;
      }
    | undefined;

  useEffect(() => {
    if (!isPending && !user) {
      router.replace("/login");
    }
  }, [isPending, user, router]);

  if (isPending || !user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <p className="muted">Carregando conta...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <h1 className="display text-4xl font-bold">Sua conta</h1>
      <div className="panel mt-8 space-y-3 p-6">
        <p>
          <span className="muted">Nome:</span> {user.name}
        </p>
        <p>
          <span className="muted">E-mail:</span> {user.email}
        </p>
        <p>
          <span className="muted">Perfil:</span> {user.role ?? "user"}
        </p>
        <p>
          <span className="muted">Status:</span> {user.status ?? "active"}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/favoritos" className="btn btn-ghost">
          Favoritos
        </Link>
        <Link href="/calendario" className="btn btn-ghost">
          Calendário
        </Link>
        <Link href="/eventos/novo" className="btn btn-teal">
          Publicar evento gratuito
        </Link>
        {user.role === "admin" && (
          <Link href="/admin/pendencias" className="btn btn-primary">
            Pendências
          </Link>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => signOut()}>
          Sair
        </button>
      </div>
    </div>
  );
}
