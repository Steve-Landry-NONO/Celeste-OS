# CELESTE OS

Version 0.1.1 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

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

Le premier incrément contient le client web responsive Next.js et un moteur financier TypeScript partagé. Le laboratoire `/lab` est une simulation isolée en mémoire ; aucun parcours réel persistant n’est encore livré. Auth, permissions RLS et client Expo sont les incréments suivants. La gestion des documents métier est spécifiée mais pas encore opérationnelle.

Prérequis : Node 24.19.0 et npm 11. Les dépendances sont fixées dans `package-lock.json`.

```bash
npm ci
npm run check
npm run dev
```

Ouvrir http://127.0.0.1:3000. Les routes disponibles sont `/`, `/documents` (liens vers le cadrage GitHub) et `/lab`. Aucun secret ni backend n’est requis pour ce socle. `npm run check` lance les types, les 14 tests du domaine et le build web. CI GitHub configurée pour PR et main ; ses résultats doivent être vérifiés séparément des contrôles locaux.

Voir [BOOTSTRAP](docs/14_BOOTSTRAP.md), les [limites du domaine](packages/domain/README.md), la [reprise](memory/HANDOFF.md) et le rapport du cycle courant.

## Sources et décisions

Les échanges fournis le 2 octobre 2026 sont la source des exigences. Le document historique `CELESTE_Badges_Salon_Mariage.pdf` a été consulté pour l’univers graphique, sans le considérer comme une charte exhaustive. Les références officielles techniques sont listées dans [SOURCES](docs/SOURCES.md). Voir [DECISIONS](docs/DECISIONS.md) pour les choix proposés.

## Recette navigateur

Après `npm run build` : `npx playwright install --with-deps chromium`, puis `npm run test:e2e`. Deux profils Chromium (desktop et mobile web) vérifient navigation, totaux, refus sans écriture, saisie décimale, remise à zéro et effacement au rechargement. Leur exécution locale est bloquée par les sockets Unix de cet environnement ; consulter la CI pour le résultat effectif. Le contrôle HTTP SSR ne remplace pas ces interactions.
