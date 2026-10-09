"use client";

import { useEffect, useState, useTransition } from "react";
import { EventCard } from "@/components/EventCard";
import { api, type ApiEvent } from "@/lib/api";

export default function HomePage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = (filters?: { city?: string; q?: string; free?: boolean }) => {
    startTransition(async () => {
      try {
        setError(null);
        const params: Record<string, string> = {};
        if (filters?.city) params.city = filters.city;
        if (filters?.q) params.q = filters.q;
        if (filters?.free) params.free = "true";
        const data = await api.listEvents(params);
        setEvents(data.events);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar");
      }
    });
  };

  useEffect(() => {
    (async () => {
      try {
        await api.syncProviders();
      } catch {
        /* sync is best-effort on first load */
      }
      load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-[var(--glow)] blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center opacity-25" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-[var(--bg-deep)]/55 to-[var(--bg-deep)]" />

        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-24 md:px-6">
          <p className="fade-up display mb-3 text-5xl font-extrabold md:text-7xl">
            Event<span className="text-[var(--accent)]">ei</span>
          </p>
          <h1 className="fade-up-delay display max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
            O mapa vivo de eventos no Brasil.
          </h1>
          <p className="fade-up-delay mt-4 max-w-xl text-lg text-[var(--ink-muted)]">
            Explore shows e cultura de todo o país. Publique apenas eventos
            100% gratuitos.
          </p>
          <div className="fade-up-delay mt-8 flex flex-wrap gap-3">
            <a href="#lista" className="btn btn-primary">
              Ver eventos
            </a>
            <a href="/eventos/novo" className="btn btn-ghost">
              Cadastrar gratuito
            </a>
          </div>
        </div>
      </section>

      <section id="lista" className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="panel mb-8 grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto_auto] md:items-end">
          <label className="field">
            <span className="text-sm muted">Buscar</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Show, cidade, palavra-chave"
            />
          </label>
          <label className="field">
            <span className="text-sm muted">Cidade</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Brasil inteiro"
            />
          </label>
          <label className="flex items-center gap-2 pb-3 text-sm">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
            />
            Só gratuitos
          </label>
          <button
            type="button"
            className="btn btn-teal"
            disabled={pending}
            onClick={() => load({ city, q, free: freeOnly })}
          >
            {pending ? "Filtrando..." : "Filtrar"}
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-2xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm">
            {error}. Confira se a API está rodando em{" "}
            <code>localhost:4000</code>.
          </p>
        )}

        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="display text-3xl font-semibold">Em cartaz</h2>
            <p className="muted text-sm">Fontes externas + eventos da comunidade</p>
          </div>
          <p className="muted text-sm">{events.length} eventos</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        {!pending && events.length === 0 && !error && (
          <p className="muted mt-8">Nenhum evento com esses filtros.</p>
        )}
      </section>
    </div>
  );
}
