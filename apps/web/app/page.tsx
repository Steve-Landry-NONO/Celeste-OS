import Link from "next/link";
export default function Home() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">UNE VISION, UN ESPACE COMMUN</p>
        <h1>
          Construire CELESTE,
          <br />
          <em>sur des bases claires.</em>
        </h1>
        <p className="lead">
          Retrouver les décisions, structurer les documents et suivre les
          contributions. Chaque évolution garde son histoire.
        </p>
      </div>
      <section className="notice" aria-label="État du produit">
        <span className="notice-icon" aria-hidden="true">
          i
        </span>
        <div>
          <strong>Le socle est en construction</strong>
          <p>
            Les données réelles ne sont pas encore connectées. L’accès privé, la
            sauvegarde et les permissions seront activés avec le backend dédié.
          </p>
        </div>
      </section>
      <section className="cards" aria-label="Modules">
        <article className="card">
          <span className="card-icon" aria-hidden="true">
            01
          </span>
          <h2>Documents & versions</h2>
          <p>
            CDC, chartes et décisions : une structure commune, des versions
            traçables et un circuit de validation.
          </p>
          <Link href="/documents" className="text-link">
            Parcourir le cadrage →
          </Link>
        </article>
        <article className="card">
          <span className="card-icon" aria-hidden="true">
            02
          </span>
          <h2>Contributions & caisse</h2>
          <p>
            Les apports personnels, les dépenses et le fonds de roulement
            restent distincts. Les remboursements sont désactivés.
          </p>
          <Link href="/lab" className="text-link">
            Essayer le simulateur →
          </Link>
        </article>
        <article className="card">
          <span className="card-icon" aria-hidden="true">
            03
          </span>
          <h2>Pilotage & mémoire</h2>
          <p>
            Les sprints, les arbitrages et la reprise de chaque session de
            développement sont documentés dans GitHub.
          </p>
          <a
            href="https://github.com/Steve-Landry-NONO/Celeste-OS/blob/main/planning/SPRINTS.md"
            className="text-link"
          >
            Consulter les sprints ↗
          </a>
        </article>
      </section>
      <section className="bottom-grid">
        <div className="panel">
          <p className="eyebrow">FINANCES RÉELLES</p>
          <h2>Un départ documenté.</h2>
          <p>
            Aucune écriture réelle importée. Aucun solde de caisse ne peut être
            déduit à ce stade.
          </p>
          <div className="empty-state">
            Les contributions apparaîtront ici après connexion et confirmation
            des écritures.
          </div>
        </div>
        <div className="panel warm">
          <p className="eyebrow">PROCHAINE ÉTAPE</p>
          <h2>Connecter le socle privé.</h2>
          <p>
            Un projet dédié est nécessaire pour l’authentification, les données
            et les pièces justificatives.
          </p>
          <a
            href="https://github.com/Steve-Landry-NONO/Celeste-OS/issues/1"
            className="text-link"
          >
            Voir la demande VAL-001 ↗
          </a>
        </div>
      </section>
    </>
  );
}
