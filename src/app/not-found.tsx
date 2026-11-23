import Link from "next/link";

const links = [
  { href: "/", it: "Home", en: "Home" },
  { href: "/preventivo", it: "Richiedi un preventivo", en: "Request a quote" },
  { href: "/chi-siamo", it: "Chi siamo", en: "About us" },
  { href: "/privacy", it: "Privacy", en: "Privacy" },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="border-b border-line px-6 py-5">
        <Link href="/" className="font-serif text-2xl text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
          Offcut
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        <p className="eyebrow">404 · Pagina non trovata / Page not found</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight sm:text-6xl">Qui non c’è nulla.</h1>
        <p className="mt-5 max-w-xl text-muted">La pagina richiesta non esiste o è stata spostata.</p>
        <p className="mt-1 max-w-xl text-muted">The page you requested doesn’t exist or has moved.</p>
        <nav aria-label="Pagine utili / Useful pages" className="mt-8 grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-xl border border-line bg-white p-4 text-forest shadow-soft transition-colors hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">
              <span>{link.it}</span><span aria-hidden="true"> · </span><span>{link.en}</span>
            </Link>
          ))}
        </nav>
      </main>
      <footer className="border-t border-line px-6 py-5 text-center text-sm text-muted">Offcut</footer>
    </div>
  );
}
