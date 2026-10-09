import Link from "next/link";
import type { ApiEvent } from "@/lib/api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function EventCard({ event }: { event: ApiEvent }) {
  return (
    <Link
      href={`/eventos/${event.id}`}
      className="group block overflow-hidden rounded-[28px] border border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-panel)_70%,transparent)] transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:shadow-[0_20px_50px_rgba(0,0,0,0.28)]"
    >
      <div
        className="relative h-40 w-full bg-cover bg-center"
        style={{
          backgroundImage: event.imageUrl
            ? `url(${event.imageUrl})`
            : "linear-gradient(135deg, rgba(62,198,182,0.35), rgba(232,93,76,0.35))",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-deep)] via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-xs backdrop-blur">
          {event.isFree ? "Gratuito" : event.priceLabel ?? "Pago na fonte"}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--accent-2)]">
          {event.city}
          {event.state ? ` · ${event.state}` : ""}
        </p>
        <h3 className="display text-xl leading-tight transition group-hover:text-[var(--accent)]">
          {event.title}
        </h3>
        <p className="muted text-sm">{formatDate(event.startsAt)}</p>
        <p className="line-clamp-2 text-sm text-[var(--ink-muted)]">
          {event.description}
        </p>
      </div>
    </Link>
  );
}
