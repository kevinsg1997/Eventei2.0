"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EventCard } from "@/components/EventCard";
import { api, type ApiEvent } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export default function FavoritosPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
      return;
    }
    if (!session?.user) return;

    (async () => {
      try {
        const data = await api.listFavorites();
        setEvents(data.favorites.map((f) => f.event));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro");
      }
    })();
  }, [isPending, session, router]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h1 className="display text-4xl font-bold">Favoritos</h1>
      <p className="muted mt-2">Eventos que você salvou para ver depois.</p>
      {error && <p className="mt-4 text-[var(--accent)]">{error}</p>}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      {!error && events.length === 0 && (
        <p className="muted mt-8">Nenhum favorito ainda.</p>
      )}
    </div>
  );
}
