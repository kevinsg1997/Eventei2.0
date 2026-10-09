"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";

const links = [
  { href: "/", label: "Explorar" },
  { href: "/favoritos", label: "Favoritos" },
  { href: "/calendario", label: "Calendário" },
  { href: "/eventos/novo", label: "Publicar" },
];

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as
    | { name?: string; role?: string; email?: string }
    | undefined;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--bg-deep)_82%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="display text-2xl font-bold tracking-tight">
          Event<span className="text-[var(--accent)]">ei</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-2 text-sm transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-[var(--ink-muted)] hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/conta" className="btn btn-ghost hidden sm:inline-flex">
                {user.name ?? "Conta"}
              </Link>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => signOut()}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">
                Entrar
              </Link>
              <Link href="/register" className="btn btn-primary">
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
