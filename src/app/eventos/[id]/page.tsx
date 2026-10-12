"use client";

import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api, type ApiEvent } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getEvent(params.id);
        setEvent(data.event);
        if (data.event.source === "user") {
          const r = await api.reportReasons();
          setReasons(r.reasons);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro");
      }
    })();
  }, [params.id]);

  async function toggleFavorite() {
    if (!session?.user || !event) return;
    try {
      await api.addFavorite(event.id);
      setMessage("Adicionado aos favoritos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro nos favoritos");
    }
  }

  async function addToCalendar() {
    if (!session?.user || !event) return;
    try {
      await api.addCalendar(event.id);
      setMessage("Adicionado ao calendário");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no calendário");
    }
  }

  async function onReport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!event) return;
    const form = new FormData(e.currentTarget);
    try {
      await api.createReport(
        event.id,
        String(form.get("reason")),
        String(form.get("details") || ""),
      );
      setShowReport(false);
      setMessage("Denúncia enviada para análise");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao denunciar");
    }
  }

  if (error && !event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <p className="text-[var(--accent)]">{error}</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <p className="muted">Carregando evento...</p>
      </div>
    );
  }

  const canReport = event.source === "user" && Boolean(session?.user);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
      <p className="text-xs uppercase tracking-[0.16em] text-[var(--accent-2)]">
        {event.city}
        {event.state ? ` · ${event.state}` : ""} · {event.source}
      </p>
      <h1 className="display mt-3 text-4xl font-bold md:text-5xl">{event.title}</h1>
      <p className="muted mt-3">
        {new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "full",
          timeStyle: "short",
        }).format(new Date(event.startsAt))}
      </p>

      <div className="panel mt-8 space-y-4 p-6">
        <p>{event.description}</p>
        <p className="muted text-sm">
          {event.venueName ? `${event.venueName} · ` : ""}
          {event.address ?? "Local a confirmar"}
        </p>
        <p className="font-medium">
          {event.isFree ? "Gratuito" : event.priceLabel ?? "Pago na fonte oficial"}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {event.externalUrl && (
          <a
            href={event.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
          >
            Ver na fonte oficial
          </a>
        )}
        {session?.user && (
          <>
            <button type="button" className="btn btn-ghost" onClick={toggleFavorite}>
              Favoritar
            </button>
            <button type="button" className="btn btn-ghost" onClick={addToCalendar}>
              No calendário
            </button>
          </>
        )}
        {canReport && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowReport((v) => !v)}
          >
            Denunciar
          </button>
        )}
      </div>

      {message && <p className="mt-4 text-sm text-[var(--accent-2)]">{message}</p>}
      {error && <p className="mt-4 text-sm text-[var(--accent)]">{error}</p>}

      {showReport && (
        <form onSubmit={onReport} className="panel mt-6 space-y-4 p-6">
          <h2 className="display text-2xl font-semibold">Denunciar publicação</h2>
          <label className="field">
            <span>Motivo</span>
            <select name="reason" required defaultValue="">
              <option value="" disabled>
                Selecione...
              </option>
              {reasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Detalhes (opcional)</span>
            <textarea name="details" rows={4} />
          </label>
          <button type="submit" className="btn btn-primary">
            Enviar denúncia
          </button>
        </form>
      )}
    </div>
  );
}
