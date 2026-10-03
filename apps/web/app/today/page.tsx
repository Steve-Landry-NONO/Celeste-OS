import { buildTodayView, projectProgress } from "@celeste/domain";
import type { WorkTask } from "@celeste/domain";

const scenarioDate = "2026-10-02";
const scenarioScope = {
  organizationId: "demo-celeste",
  actorId: "demo-steve",
  projectIds: ["brand", "product"],
  missionIds: [],
} as const;
const tasks: WorkTask[] = [
  {
    id: "visuals",
    organizationId: "demo-celeste",
    projectId: "brand",
    assigneeId: "demo-steve",
    title: "Valider les visuels du salon",
    status: "in_review",
    priority: "urgent",
    dueDate: scenarioDate,
    createdAt: "2026-10-01T09:00:00Z",
  },
  {
    id: "supplier",
    organizationId: "demo-celeste",
    projectId: "brand",
    assigneeId: "demo-steve",
    title: "Contacter le prestataire badges",
    status: "todo",
    priority: "high",
    dueDate: "2026-10-01",
    createdAt: "2026-09-30T15:00:00Z",
  },
  {
    id: "weekly",
    organizationId: "demo-celeste",
    projectId: "product",
    assigneeId: "demo-steve",
    title: "Préparer le Weekly CELESTE",
    status: "in_progress",
    priority: "high",
    dueDate: scenarioDate,
    createdAt: "2026-10-01T08:00:00Z",
  },
  {
    id: "brief",
    organizationId: "demo-celeste",
    projectId: "product",
    assigneeId: "demo-steve",
    title: "Relire le brief du pilote",
    status: "blocked",
    priority: "normal",
    dueDate: "2026-10-03",
    createdAt: "2026-10-01T11:00:00Z",
    blockedReason: "Backend de développement à identifier",
  },
  {
    id: "hidden-mission",
    organizationId: "demo-celeste",
    projectId: "brand",
    missionId: "private-designer-mission",
    assigneeId: "demo-steve",
    title: "Cette tâche ne doit pas apparaître",
    status: "todo",
    priority: "urgent",
    dueDate: scenarioDate,
    createdAt: "2026-10-01T07:00:00Z",
  },
  {
    id: "brand-done",
    organizationId: "demo-celeste",
    projectId: "brand",
    assigneeId: "demo-maeva",
    title: "Réserver les badges",
    status: "done",
    priority: "normal",
    dueDate: "2026-09-30",
    createdAt: "2026-09-29T10:00:00Z",
  },
  {
    id: "product-done",
    organizationId: "demo-celeste",
    projectId: "product",
    assigneeId: "demo-stephane",
    title: "Valider le cadrage produit",
    status: "done",
    priority: "normal",
    dueDate: "2026-10-01",
    createdAt: "2026-09-29T12:00:00Z",
  },
];

const view = buildTodayView(tasks, scenarioScope, scenarioDate);

const labels = {
  overdue: "En retard",
  today: "Aujourd’hui",
  upcoming: "À venir",
  unscheduled: "Sans échéance",
};

const statusLabels = {
  todo: "À faire",
  in_progress: "En cours",
  blocked: "Bloquée",
  in_review: "À valider",
  done: "Terminée",
  cancelled: "Annulée",
};

const projects = [
  { id: "brand", name: "Marque & salon" },
  { id: "product", name: "Produit CELESTE" },
];

export default function Today() {
  return (
    <>
      <div className="today-heading">
        <div>
          <p className="eyebrow">VENDREDI 2 OCTOBRE · SCÉNARIO FICTIF</p>
          <h1>
            Bonjour Steve, <em>voici l’essentiel.</em>
          </h1>
          <p className="lead">
            Cette vue démontre le tri, les compteurs et les périmètres du futur
            cockpit. Elle n’est ni connectée ni persistante.
          </p>
        </div>
        <span className="demo-pill">Démonstration isolée</span>
      </div>

      <section className="today-summary" aria-label="Résumé fictif du jour">
        <div>
          <span>À traiter</span>
          <strong data-testid="today-total">{view.counts.total}</strong>
        </div>
        <div>
          <span>En retard</span>
          <strong>{view.counts.overdue}</strong>
        </div>
        <div>
          <span>À valider</span>
          <strong>{view.counts.inReview}</strong>
        </div>
        <div>
          <span>Bloquée</span>
          <strong>{view.counts.blocked}</strong>
        </div>
      </section>

      <div className="today-layout">
        <section className="panel today-panel" aria-labelledby="today-tasks">
          <div className="section-heading">
            <div>
              <p className="eyebrow">MON ATTENTION</p>
              <h2 id="today-tasks">Tâches prioritaires</h2>
            </div>
            <span className="badge">{view.counts.today} aujourd’hui</span>
          </div>
          <ol className="task-list">
            {view.items.map(({ task, timing }) => (
              <li key={task.id} data-testid="today-task">
                <span
                  className={`task-dot priority-${task.priority}`}
                  aria-hidden="true"
                />
                <div className="task-copy">
                  <strong>{task.title}</strong>
                  <span>
                    {statusLabels[task.status]} · {labels[timing]}
                  </span>
                  {task.blockedReason && <small>{task.blockedReason}</small>}
                </div>
                <span className={`timing timing-${timing}`}>{labels[timing]}</span>
              </li>
            ))}
          </ol>
        </section>

        <aside className="today-side">
          <section className="panel">
            <p className="eyebrow">PROJETS</p>
            <h2>Progression calculée</h2>
            <div className="project-progress-list">
              {projects.map((project) => {
                const progress = projectProgress(
                  tasks,
                  scenarioScope,
                  project.id,
                );
                return (
                  <div key={project.id}>
                    <span>
                      {project.name}
                      <strong>
                        {progress === null ? "Non calculée" : `${progress} %`}
                      </strong>
                    </span>
                    {progress !== null && (
                      <progress value={progress} max="100">
                        {progress} %
                      </progress>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
          <section className="notice today-warning">
            <span className="notice-icon" aria-hidden="true">
              i
            </span>
            <div>
              <strong>Aucune donnée réelle</strong>
              <p>
                Les compteurs proviennent uniquement du scénario intégré. La
                future API devra appliquer les mêmes périmètres côté serveur.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </>
  );
}
