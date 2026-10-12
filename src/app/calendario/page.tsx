"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, type ApiEvent } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

export default function CalendarioPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [cursor, setCursor] = useState(() => new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.replace("/login");
      return;
    }
    if (!session?.user) return;

    (async () => {
      try {
        const data = await api.listCalendar();
        setEvents(data.entries.map((e) => e.event));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro");
      }
    })();
  }, [isPending, session, router]);

  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(cursor);

  const days = useMemo(() => buildMonthGrid(cursor), [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, ApiEvent[]>();
    for (const event of events) {
      const key = dayKey(new Date(event.startsAt));
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-4xl font-bold">Calendário</h1>
          <p className="muted mt-2">Seus eventos salvos no mês.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
            }
          >
            ←
          </button>
          <p className="display min-w-40 text-center text-xl capitalize">
            {monthLabel}
          </p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
            }
          >
            →
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-[var(--accent)]">{error}</p>}

      <div className="panel mt-8 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-[var(--line)] text-center text-xs uppercase tracking-wider text-[var(--ink-muted)]">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="px-2 py-3">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-28 border-[var(--line)] border-r border-b bg-black/10"
                />
              );
            }
            const key = dayKey(day);
            const dayEvents = eventsByDay.get(key) ?? [];
            const inMonth = day.getMonth() === cursor.getMonth();
            return (
              <div
                key={key}
                className={`min-h-28 border-r border-b border-[var(--line)] p-2 ${
                  inMonth ? "" : "opacity-40"
                }`}
              >
                <p className="text-sm font-medium">{day.getDate()}</p>
                <div className="mt-1 space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <Link
                      key={event.id}
                      href={`/eventos/${event.id}`}
                      className="block truncate rounded-md bg-[var(--accent)]/20 px-1.5 py-0.5 text-[11px] hover:bg-[var(--accent)]/35"
                    >
                      {event.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function buildMonthGrid(cursor: Date) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];

  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
