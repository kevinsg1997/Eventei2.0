"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type ApiEvent } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

type ReportRow = {
  id: string;
  reason: string;
  details?: string | null;
  createdAt: string;
  event: ApiEvent;
  reporter: { id: string; name: string; email: string };
};

export default function AdminPendenciasPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const user = session?.user as { role?: string } | undefined;
  const [tab, setTab] = useState<"denuncias">("denuncias");
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    try {
      setError(null);
      const data = await api.adminPendingReports();
      setReports(data.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    }
  }

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/");
      return;
    }
    load();
  }, [isPending, user, router]);

  async function resolve(id: string, action: "accept" | "reject") {
    try {
      await api.resolveReport(id, action);
      setMessage(
        action === "accept"
          ? "Denúncia aceita: evento ocultado (e ban se aplicável)"
          : "Denúncia rejeitada",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao resolver");
    }
  }

  if (isPending || user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 md:px-6">
        <p className="muted">Verificando acesso...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <h1 className="display text-4xl font-bold">Pendências</h1>
      <p className="muted mt-2">Área administrativa — não listada no menu público.</p>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          className={`btn ${tab === "denuncias" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setTab("denuncias")}
        >
          Denúncias
        </button>
      </div>

      {message && <p className="mt-4 text-sm text-[var(--accent-2)]">{message}</p>}
      {error && <p className="mt-4 text-sm text-[var(--accent)]">{error}</p>}

      {tab === "denuncias" && (
        <div className="mt-8 space-y-4">
          {reports.map((report) => (
            <article key={report.id} className="panel space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="display text-2xl font-semibold">
                    {report.event.title}
                  </h2>
                  <p className="muted text-sm">
                    Motivo: {report.reason}
                  </p>
                  <p className="muted text-sm">
                    Por {report.reporter.name} ({report.reporter.email})
                  </p>
                </div>
                <p className="text-xs text-[var(--ink-muted)]">
                  {new Date(report.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
              {report.details && <p className="text-sm">{report.details}</p>}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => resolve(report.id, "accept")}
                >
                  Aceitar
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => resolve(report.id, "reject")}
                >
                  Rejeitar
                </button>
              </div>
            </article>
          ))}
          {reports.length === 0 && (
            <p className="muted">Nenhuma denúncia pendente.</p>
          )}
        </div>
      )}
    </div>
  );
}
