# CELESTE OS

Version 0.1.7 · 4 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

CELESTE OS centralise le pilotage de CELESTE sur téléphone et sur ordinateur. Ce dépôt prépare un pilote utilisable par Steve, Maeva et Stéphane, puis l’ouverture contrôlée aux collaborateurs et prestataires. Il concerne l’outil interne de pilotage et reste distinct du développement de la marketplace CELESTE.

La vision produit et les règles demandées par Steve sont acquises. Les choix techniques, les seuils financiers et les responsabilités opérationnelles proposés dans ce dossier restent identifiés comme tels. Aucun montant réel, dépense reconstituée, compte utilisateur ou avancement métier n’est inventé.

## Lire le dossier

| Besoin | Document de référence |
|---|---|
| Comprendre le projet | [Cadrage](docs/01_CADRAGE.md) |
| Savoir ce que la solution doit faire | [Cahier des charges](docs/02_CAHIER_DES_CHARGES.md) |
| Développer les parcours | [Spécifications](docs/03_SPECIFICATIONS_FONCTIONNELLES.md) |
| Calculer les finances | [Règles financières](docs/04_FINANCE.md) |
| Gérer les documents CELESTE | [Gestion documentaire](docs/05_GESTION_DOCUMENTAIRE.md) |
| Construire les interfaces | [UX et identité](docs/06_UX_DESIGN.md) |
| Organiser le code | [Architecture](docs/07_ARCHITECTURE.md) |
| Concevoir la base et les accès | [Modèle de données](docs/08_DATA_MODEL.md) et [permissions](docs/09_PERMISSIONS.md) |
| Planifier | [Roadmap](docs/10_ROADMAP.md), [backlog](planning/backlog.csv) et [sprints](planning/SPRINTS.md) |
| Vérifier | [Recette](docs/11_RECETTE.md) |
| Reprendre avec un agent | [AGENTS](AGENTS.md), [contexte](memory/CONTEXT.md) et [état](memory/STATE.json) |
| Choisir les outils externes | [Intégrations](docs/12_INTEGRATIONS.md) |
| Préparer l’exploitation | [Exploitation](docs/13_EXPLOITATION.md) |

## État réel

Le dépôt privé [Steve-Landry-NONO/Celeste-OS](https://github.com/Steve-Landry-NONO/Celeste-OS) a été confirmé par Steve et vérifié accessible en écriture le 2 octobre 2026. Cette initialisation centralise les spécifications, règles et mémoire. Le code arrive par incréments et PR ; voir memory/STATE.json pour son état réel.

Un cycle est activé trois fois par jour, autour de 10 h, 14 h et 18 h Europe/Paris, jusqu’au 15 octobre. La première session est lancée aujourd’hui. Les demandes de validation sont conservées dans les issues et le registre [validations](validations/README.md), avec relais email à Steve si une réponse est nécessaire.

## Programme

J1 à J14 : 2 au 15 octobre 2026, heure Europe/Paris. Première recette anticipée possible le 12 octobre. Un pilote sûr et utilisable est la cible ; la plateforme complète évolue ensuite par versions. Les dates supposent les accès techniques et les décisions de démarrage disponibles dès J1 ou J2.

## Source de vérité

GitHub garde les spécifications techniques, décisions, code, migrations, tests et rapports de développement. CELESTE OS gère les documents métier et leurs versions ; la plateforme référence les documents techniques GitHub sans créer une deuxième branche de vérité indépendante. Les exports Word sont des instantanés de lecture ; les Markdown de ce dossier portent les spécifications éditables.

## Installation et vérification

Le premier incrément contient le client web responsive Next.js, un moteur financier TypeScript partagé et le contrat de sélection de l’écran « Aujourd’hui ». `/today` et `/lab` utilisent uniquement des scénarios fictifs isolés ; les routes Auth et espaces d’organisation apportent la première persistance réelle. Auth et organisations sont maintenant persistés via Supabase ; le client Expo reste à construire. La gestion des documents métier est spécifiée mais pas encore opérationnelle.

Prérequis : Node 24.19.0 et npm 11. Les dépendances sont fixées dans `package-lock.json`.

```bash
npm ci
npm run check
npm run dev
```

Ouvrir http://127.0.0.1:3000. Les routes disponibles sont `/`, `/today`, `/documents`, `/lab`, `/login`, `/register`, `/auth/callback` et `/workspace`. Les démonstrations restent accessibles sans backend ; voir [configuration Auth](docs/16_AUTH_SETUP.md) pour les parcours persistés. `npm run check` lance les types, les 24 tests domaine, 3 tests configuration et le build web. CI GitHub configurée pour PR et main ; ses résultats doivent être vérifiés séparément des contrôles locaux.

Voir [BOOTSTRAP](docs/14_BOOTSTRAP.md), les [limites du domaine](packages/domain/README.md), la [reprise](memory/HANDOFF.md) et le rapport du cycle courant.

## Sources et décisions

Les échanges fournis le 2 octobre 2026 sont la source des exigences. Le document historique `CELESTE_Badges_Salon_Mariage.pdf` a été consulté pour l’univers graphique, sans le considérer comme une charte exhaustive. Les références officielles techniques sont listées dans [SOURCES](docs/SOURCES.md). Voir [DECISIONS](docs/DECISIONS.md) pour les choix proposés.

## Recette navigateur

Après `npm run build` : `npx playwright install --with-deps chromium`, puis `npm run test:e2e`. Quatre tests de démonstration répartis entre deux profils Chromium (desktop et mobile web) vérifient navigation, périmètre et compteurs de « Aujourd’hui », totaux, refus sans écriture, saisie décimale, précision des grands montants, remise à zéro et effacement au rechargement. Le navigateur Playwright requis est absent de cet environnement ; l’exécutable de secours est bloqué par ses sockets Unix. Consulter la CI pour les résultats interactifs réellement exécutés. Le contrôle HTTP SSR ne remplace pas ces interactions.

La CI ajoute quatre parcours Auth (desktop/mobile) sur Supabase local jetable : refus de connexion, session, création et persistance d’organisation, isolation API, cookies protégés, déconnexion et callback invalide. Hors pile locale configurée, ces quatre tests sont skipped et ne constituent aucune preuve Auth. Voir [rapport AUTH](reports/2026-10-02_AUTH.md).

Recette Auth et démonstrations vérifiée : [CI réussie du code ac0a15f](https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/37044433038) — huit tests navigateur sans skip, 26 assertions SQL, 26 tests unitaires et build. Captures d’espaces desktop/mobile inspectées ; la confirmation email distante et le déploiement restent à préparer.

Administration des membres : `/workspace/members?organization=<id>` permet aux administrateurs actifs de modifier un rôle ou suspendre une appartenance existante. Accès serveur/base, protection du dernier administrateur et conflit de version ; les noms sont disponibles via un annuaire administratif limité à cet espace ; les invitations sont disponibles dans le lot fusionné et testé. Voir [rapport CE-003](reports/2026-10-03_MEMBERS.md) pour la preuve de recette courante.

Recette membres vérifiée le 3 octobre : [CI réussie](https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/37108614505), dix tests navigateur sans skip, 26 assertions SQL et 26 tests unitaires. Captures membres desktop/mobile inspectées. Socle fusionné en PR #2, sans preuve de déploiement ; l’annuaire suit en PR #3.

Annuaire CE-003 en [PR #3](https://github.com/Steve-Landry-NONO/Celeste-OS/pull/3) : noms limités à l’espace administré, profils propres inchangés. [CI réussie](https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/37109445474) : dix parcours sans skip, contrôles SQL, types, 26 tests unitaires et build. Fonction distante et refus vérifiés, fixtures annulées, captures inspectées ; cet incrément est fusionné, sans déploiement web. Voir [rapport annuaire](reports/2026-10-03_DIRECTORY.md).

Invitations : création et révocation dans Gérer les membres, acceptation depuis [Rejoindre un espace](/join). Le code expire après 7 jours ; adresse confirmée obligatoire. PR #4 fusionnée après douze tests navigateur, contrôles SQL et build réussis. Aucun email automatique. Voir [rapport invitations](reports/2026-10-03_INVITATIONS.md) pour la recette effective. Scopes projet/mission toujours à livrer.

Backend distant actuellement en pause : restauration refusée par le quota de deux projets gratuits actifs, tous deux FamilyRoot. Décision [VAL-002](https://github.com/Steve-Landry-NONO/Celeste-OS/issues/5) attendue ; les tests CI utilisent leur propre base jetable.

Projets et missions : [PR #6 fusionnée](https://github.com/Steve-Landry-NONO/Celeste-OS/pull/6), route `/workspace/scopes`, création et accords individuels de lecture. Révocation, version, audit du membre visé et distinction des accords conservés mais inactifs. [CI finale réussie](https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/37122978688) : quatre suites SQL, contrôle de sécurité sans avertissement/erreur, 26 tests unitaires, build et 14 parcours desktop/mobile sans skip. Six captures inspectées. Backend distant toujours en pause, nouvelle migration non appliquée, aucun déploiement. Les fichiers privés et capacités d’écriture restent à livrer. Voir [rapport scopes](reports/2026-10-03_SCOPES.md) et [ADR-009](docs/adr/009_SCOPED_ACCESS.md).

Fichiers privés projet/mission : [PR #7 fusionnée](https://github.com/Steve-Landry-NONO/Celeste-OS/pull/7), dépôt serveur inspecté, empreinte SHA-256, bucket privé et téléchargement signé 60 secondes. La capacité de dépôt est distincte de la lecture ; aucun upload/finalize direct n'est accordé au client et la révocation est sérialisée avec la finalisation. [CI finale réussie](https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/37137848450) : cinq suites SQL, security advisors, 27 tests unitaires/configuration, build et 16 parcours sans skip. Voir [rapport fichiers](reports/2026-10-03_PRIVATE_FILES.md) et [ADR-010](docs/adr/010_PRIVATE_SCOPE_FILES.md). Le backend distant reste inchangé tant que VAL-002 bloque sa restauration.

Finance CE-004 fusionnée en [PR #8](https://github.com/Steve-Landry-NONO/Celeste-OS/pull/8) : `/workspace/finance` crée une catégorie et confirme une dépense personnelle EUR avec justificatif privé du même projet ou de la même mission. La transaction ajoute exactement une contribution, sans mouvement de caisse ; historique après suspension, date civile d’organisation, idempotence, RLS, grants explicites et immutabilité sont couverts. La [CI finale](https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/37201096755) passe six suites SQL, security advisors, 27 tests domaine/configuration, build et 18 parcours desktop/mobile sans skip ; captures inspectées. Fonds, versements et remboursements restent désactivés. Voir [ADR-011](docs/adr/011_PERSONAL_EXPENSES.md) et le [rapport du 4 octobre](reports/2026-10-04_EXPENSES.md).
