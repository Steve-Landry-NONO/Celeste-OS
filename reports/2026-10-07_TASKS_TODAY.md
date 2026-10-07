# Rapport CE-007 — phases, tâches et Aujourd’hui

Date : 7 octobre 2026  
Branche : `feat/ce-007-tasks-today`  
PR : https://github.com/Steve-Landry-NONO/Celeste-OS/pull/11

## Résultat

CE-007 ajoute les phases de projet, les tâches à responsable unique et leur historique append-only. La base impose la cohérence phase/projet, le motif des tâches bloquées, la version attendue et le refus interorganisation. L’écriture de tâches est un droit distinct de la lecture et des fichiers ; elle se révoque avec la lecture et ne s’hérite pas du projet aux missions.

La route `/workspace/tasks` affiche les tâches personnelles dues ou en retard, les compteurs Aujourd’hui et la progression calculée par projet. Elle permet la création de phases aux administrateurs, la création de tâches sur les périmètres autorisés et les changements d’état avec version. L’administration des périmètres expose séparément le droit d’écriture des tâches.

## Contrôles

`npm ci`, `npm run check`, `npx playwright test --list` et `git diff --check` passent localement : types, 24 tests domaine, 3 tests de configuration, build Next.js et découverte des 20 parcours, avec la route persistée `/workspace/tasks`. Docker/Podman et Chromium ne sont pas disponibles localement ; SQL et interactions sont donc prouvés par la CI jetable.

La tête de code `6c5896408933a30a233043dd40e633de7e69aa32` passe la CI 37594346150 : dix migrations, neuf suites SQL avec rollback, security advisors sans avertissement ni erreur, types, 24 tests domaine, 3 configuration, build et 20 parcours Playwright desktop/mobile sans échec ni skip. Artifact 11470151562 ; les quatre captures admin/membre desktop/mobile ont été inspectées, sans débordement ni défaut bloquant.

Les exécutions antérieures ne sont pas retenues comme preuve finale. CI 37592853104 a exposé un wrapper public ne pouvant plus appeler le helper privé ; les wrappers contrôlés possèdent désormais l’appel et les helpers restent inaccessibles aux clients. CI 37593255200 a exposé le format PostgreSQL de `created_at`, normalisé à la frontière web. CI 37593767464 a exposé une course de reconnexion du test membre, qui attend désormais explicitement la session. La revue statique a en plus interdit à un délégataire `task_write` d’assigner une tâche à autrui ; la suite SQL finale couvre ce refus.

## Provenance et dépendances

Le 7 octobre, aucune branche ou PR CE-007 concurrente n’était ouverte. VAL-002 reste ouverte sans commentaire humain. Le profil Gmail connecté est `stevelandryk89@gmail.com` ; le seul message pertinent retrouvé, `1a0fc206ec1ced41`, est déjà enregistré comme `email_sent` EV-0003 et a été exclu avant interprétation. Aucun nouvel email ni relance.

Le projet Supabase CELESTE OS `vxdneuoglidyngzdfmjc` reste INACTIVE. `familyroots-mvp` et `FamilyROOT Test` restent ACTIVE_HEALTHY et inchangés. Aucune restauration, pause, migration distante ou publication n’a été effectuée.

## Calendrier et risques

La baseline reste recette anticipée le 12 octobre et pilote le 15 à titre de référence. La condition du 6 octobre à midi est dépassée : si le backend est réactivé au plus tard le 7 octobre à midi, la prévision distante devient recette utilisateurs le 16 octobre et pilote le 19 ; au-delà, ajouter au moins un jour aux deux dates par jour de blocage. La recette technique sur pile jetable reste visée le 12.

Le risque principal reste la revalidation distante des migrations, l’onboarding et la recette complète après restauration. CE-007 ne touche pas les contributions, la caisse, le verrou des remboursements ou l’immutabilité des documents publiés.
