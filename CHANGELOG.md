# Historique de CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Dossier initial du 2 octobre 2026

Version documentaire 0.1.0. Cadrage, CDC, spécifications, finance, documents versionnés, UX, architecture, données, permissions, roadmap, recette, intégrations, exploitation, initialisation, gouvernance et mémoire. Deux sprints et backlog initial.

Cette version est un lot documentaire proposé pour revue. Elle ne désigne pas une version applicative CELESTE OS déjà publiée.

## Incrément 0.1.1 — non publié

Fondations web Next.js, domaine financier TypeScript partagé et tests. Simulation isolée et liens vers les documents GitHub. CI types/domaine/build et recette navigateur configurée. Validation VAL-001 et email tracés. Aucun parcours financier réel, Auth, client Expo ou déploiement encore livré.

Correction de revue du 2 octobre : affichage EUR exact jusqu’au dernier centime accepté, formateur partagé et quatre tests de régression supplémentaires (18 tests domaine). Recette navigateur étendue aux grands montants et au refus sans écriture d’un dépassement de capacité. L’état d’exécution distant est consigné dans la PR #2 et le rapport de précision.

Contrat « Aujourd’hui » ajouté dans le même incrément : tâche à responsable unique, motif obligatoire si bloquée, dates civiles contrôlées, tri déterministe, progression calculée et filtrage cohérent par organisation, projet et mission. Nouvelle route `/today` explicitement fictive et mobile-first. Six tests portent le domaine à 24 ; la persistance et les contrôles serveur restent bloqués par VAL-001.
