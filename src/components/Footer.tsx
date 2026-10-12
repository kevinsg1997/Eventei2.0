export function Footer() {
  return (
    <footer className="border-t border-[var(--line)] py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 md:flex-row md:items-center md:justify-between md:px-6">
        <p className="display text-lg font-semibold">
          Event<span className="text-[var(--accent)]">ei</span>
        </p>
        <p className="muted text-sm">
          Descubra eventos no Brasil. Cadastre só o que for gratuito.
        </p>
      </div>
    </footer>
  );
}
