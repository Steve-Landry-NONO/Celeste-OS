import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {
  title: "CELESTE OS · Espace de travail",
  description: "Documents, contributions et pilotage de CELESTE.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <a className="skip" href="#contenu">
          Aller au contenu
        </a>
        <div className="workspace">
          <aside className="sidebar">
            <Link href="/" className="brand" aria-label="CELESTE OS accueil">
              <span className="mark" aria-hidden="true">
                C
              </span>
              <span>
                CELESTE<span className="brand-sub">OPERATING SYSTEM</span>
              </span>
            </Link>
            <p className="nav-label">ESPACE DE TRAVAIL</p>
            <nav aria-label="Navigation principale">
              <Link href="/workspace">Mes espaces <span aria-hidden="true">↗</span></Link>
              <Link href="/login">Connexion <span aria-hidden="true">↗</span></Link>
              <Link href="/today">
                Aujourd’hui <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/">
                Vue d’ensemble <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/documents">
                Documents <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/lab">
                Laboratoire finance <span aria-hidden="true">↗</span>
              </Link>
            </nav>
            <div className="sidebar-note">
              <span className="dot" /> Fondations en cours
              <p>
                Une base commune.
                <br />
                Une mémoire durable.
              </p>
            </div>
            <a
              className="repo-link"
              href="https://github.com/Steve-Landry-NONO/Celeste-OS"
            >
              Ouvrir le dépôt GitHub ↗
            </a>
          </aside>
          <div className="main">
            <header className="topbar">
              <span>CELESTE / PILOTE</span>
              <span className="badge">Socle de développement</span>
            </header>
            <main id="contenu">{children}</main>
            <footer>
              CELESTE OS · Contributions, documents et décisions réunis.
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
