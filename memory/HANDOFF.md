# Reprise — fondations du 2 octobre 2026

## Où reprendre

Dépôt privé Steve-Landry-NONO/Celeste-OS. Documentation et validations sur main. Incrément actif dans `feat/ce-002-foundations` ; chercher sa PR ouverte avant de créer une autre branche. Les SHA exacts et l’exécution CI se retrouvent dans la PR. STATE conserve la base précédente sans référence circulaire au commit courant.

## Résultat concret

Workspaces npm : web Next.js et domaine TypeScript. Accueil et catalogue du cadrage GitHub, simulateur financier isolé, moteur EUR immuable, idempotence en mémoire et 14 tests. Installation propre `npm ci`, types et build passés. Trois routes répondent HTTP 200 avec contenu SSR. Les deux tests Playwright desktop/mobile passent dans le run 36997842066, sur le commit c6b01e7a21cd1f0853316610e2457ee53b352a32. Les captures desktop accueil et mobile laboratoire ont été inspectées.

Aucun compte ni donnée réelle. Pas de serveur Auth, RLS, pièce privée, transaction SQL, client Expo ou déploiement. Le laboratoire est explicitement fictif et non persistant. Les contrôles d’organisation du domaine ne prouvent pas l’isolation serveur.

## Blocage précis

VAL-001 / issue #1 : identifier le backend dédié. Email envoyé, ID archivé dans validations/events.jsonl ; ne pas renvoyer la demande ni prendre l’email envoyé à soi pour une réponse. L’absence de réponse bloque Auth et persistance, pas les autres tâches prêtes.

Le navigateur local et le daemon agent-browser ont échoué à créer un socket Unix (`Operation not permitted`). Ne pas enregistrer la recette navigateur comme réussie. Vérifier les tests Playwright sur le runner GitHub et corriger le premier échec avec ses logs. La configuration inclut un vrai serveur web dans le même processus de test.

## Prochain incrément

1. Lire PR, CI et réponses VAL-001. Corriger les contrôles en échec avant d’empiler du code.
2. Après identification du backend : migrations, Auth, organisations et politiques RLS testées sur deux organisations (CE-002/003).
3. Intégrer dépenses et contributions dans une transaction serveur avec journal, acteur, date et contraintes d’idempotence ; les règles pures sont déjà testées mais ne remplacent pas ces contrôles.
4. Initialiser le client Expo. `apps/mobile/README.md` ne constitue pas un client exécutable.

Cycle activé autour de 10 h, 14 h et 18 h Europe/Paris du 2 au 15 octobre. Cible pilote le 15, recette anticipée le 12 ; réviser le calendrier explicitement si le backend tarde.

## Références publiées

PR active : https://github.com/Steve-Landry-NONO/Celeste-OS/pull/2. Commit de code testé localement : `68a0549e89a2bc0022112a207b9dca1508eb8ea2`. CI GitHub passée sur le commit de recette c6b01e7a21cd1f0853316610e2457ee53b352a32. Une actualisation documentaire peut relancer la CI ; lire les checks de la tête courante avant fusion.

Preuve finale : https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/36997842066. Artifact `browser-evidence` (captures et rapport), conservé 14 jours. La recette web couvre seulement le socle et la simulation, pas Auth/RLS ni Expo.
