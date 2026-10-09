"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export default function NewEventPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    const startsLocal = String(form.get("startsAt"));
    const startsAt = new Date(startsLocal).toISOString();

    try {
      const { event: created } = await api.createEvent({
        title: String(form.get("title")),
        description: String(form.get("description") || ""),
        startsAt,
        city: String(form.get("city")),
        state: String(form.get("state") || "") || null,
        address: String(form.get("address") || "") || null,
        venueName: String(form.get("venueName") || "") || null,
        category: String(form.get("category") || "") || null,
        freeDeclaration: true,
      });
      router.push(`/eventos/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao publicar");
      setLoading(false);
    }
  }

  if (isPending || !session?.user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 md:px-6">
        <p className="muted">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
      <h1 className="display text-4xl font-bold">Publicar evento gratuito</h1>
      <p className="muted mt-2">
        Somente eventos 100% gratuitos. Eventos pagos podem gerar banimento após
        denúncia e análise.
      </p>

      <form onSubmit={onSubmit} className="panel mt-8 space-y-4 p-6">
        <label className="field">
          <span>Nome do evento</span>
          <input name="title" required minLength={3} />
        </label>
        <label className="field">
          <span>Descrição</span>
          <textarea name="description" rows={4} />
        </label>
        <label className="field">
          <span>Data e hora</span>
          <input name="startsAt" type="datetime-local" required />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            <span>Cidade</span>
            <input name="city" required />
          </label>
          <label className="field">
            <span>UF</span>
            <input name="state" maxLength={2} placeholder="SP" />
          </label>
        </div>
        <label className="field">
          <span>Local / endereço</span>
          <input name="address" />
        </label>
        <label className="field">
          <span>Nome do espaço</span>
          <input name="venueName" />
        </label>
        <label className="field">
          <span>Categoria</span>
          <input name="category" placeholder="Cultura, Shows, Esporte..." />
        </label>

        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" required className="mt-1" />
          <span>
            Declaro que este evento é <strong>totalmente gratuito</strong> e
            não exige compra de ingresso.
          </span>
        </label>

        {error && <p className="text-sm text-[var(--accent)]">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Publicando..." : "Publicar evento"}
        </button>
      </form>
    </div>
  );
}
