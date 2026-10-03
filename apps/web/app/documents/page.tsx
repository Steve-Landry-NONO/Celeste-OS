const root = "https://github.com/Steve-Landry-NONO/Celeste-OS/blob/main/";
const documents = [
  [
    "Cadrage du produit",
    "Vision, objectifs et périmètre du pilote.",
    "docs/01_CADRAGE.md",
  ],
  [
    "Cahier des charges",
    "Exigences et critères de réussite.",
    "docs/02_CAHIER_DES_CHARGES.md",
  ],
  [
    "Règles financières",
    "Contributions, caisse et régime futur.",
    "docs/04_FINANCE.md",
  ],
  [
    "Gouvernance documentaire",
    "États, versions, validations et archivage.",
    "docs/05_GESTION_DOCUMENTAIRE.md",
  ],
  [
    "Design & expérience",
    "Référence visuelle et parcours mobile.",
    "docs/06_UX_DESIGN.md",
  ],
  [
    "Mémoire & décisions",
    "Contexte durable et arbitrages datés.",
    "docs/DECISIONS.md",
  ],
];
export default function Documents() {
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">RÉFÉRENTIEL DU PROJET</p>
        <h1>
          Chaque document,
          <br />
          <em>une histoire lisible.</em>
        </h1>
        <p className="lead">
          Le cadrage actuel est centralisé et versionné dans GitHub. Les liens
          ci-dessous ouvrent les documents du dépôt privé.
        </p>
      </div>
      <section className="notice">
        <span className="notice-icon" aria-hidden="true">
          i
        </span>
        <div>
          <strong>Gestion documentaire de l’application à venir</strong>
          <p>
            Les fichiers CELESTE ne sont pas encore importés. Le dépôt contient
            les spécifications du produit ; ce catalogue ne constitue pas un
            circuit d’approbation opérationnel.
          </p>
        </div>
      </section>
      <div className="document-list">
        {documents.map(([title, description, path]) => (
          <a className="document-row" key={path} href={root + path}>
            <span className="document-symbol" aria-hidden="true">
              ↗
            </span>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
            <span className="badge">Markdown · GitHub</span>
          </a>
        ))}
      </div>
    </>
  );
}
