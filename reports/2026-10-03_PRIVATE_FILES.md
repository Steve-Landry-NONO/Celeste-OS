# CE-003 — Fichiers privés projet/mission

3 octobre 2026 · Branche `feat/ce-003-private-files` · PR [#7](https://github.com/Steve-Landry-NONO/Celeste-OS/pull/7)

## Résultat

Un membre autorisé peut déposer depuis `/workspace/scopes` un PDF, document Office, texte/Markdown ou image de 20 Mio maximum dans un projet ou une mission. L'interface distingue lecture et dépôt ; un administrateur peut accorder ou retirer le dépôt avec contrôle de version. Les prestataires restent limités aux missions.

Les octets passent par le serveur : contrôle de signature et MIME, empreinte SHA-256, stockage privé, finalisation après relecture verrouillée du droit. Une URL signée de téléchargement, en pièce jointe et valable 60 secondes, n'est délivrée qu'après une nouvelle vérification. Les objets prêts ne sont ni remplaçables ni supprimables par le client.

La revue automatique a trouvé deux défauts sur la première version : un client pouvait contourner l'inspection par un upload/finalize direct, et une finalisation pouvait courir avec une révocation. Le commit corrigé `71eda9de4256746a887a359d87ecad041ac69be3` retire ces droits client, réserve l'upload réel au serveur et sérialise finalisation/révocation sur le même verrou d'organisation. Les tests de contournement direct ont été ajoutés.

Le code est écrit, poussé, testé et fusionné. Tête finale vérifiée `3e9473d2de54602d590f9e0aabf7d14fdb21c8d9`; merge `45a701b919c77c5e434279a8f362c76cbc65943e`. Il n'est pas déployé.

## Vérifications

- `npm ci` puis `npm run check` localement : types, 24 tests domaine, 3 tests configuration et build Next.js réussis.
- Navigateur et SQL locaux non exécutés : Docker et Chromium absents. `npx playwright test --list` découvre 16 tests.
- CI [37136937459](https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/37136937459) sur la première correction : migrations, cinq suites SQL avec rollback, security advisors sans warn/error, types, tests et build réussis ; 14 parcours historiques passent mais les 2 uploads échouent à la finalisation.
- CI [37137556225](https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/37137556225) : le nouveau test de finalisation serveur a isolé un grant incomplet avant le navigateur — `service_role` avait EXECUTE sur la fonction, sans USAGE sur le schéma privé. Correction par grant minimal au seul rôle serveur. La garde relit aussi le rôle PostgREST effectif, compatible avec les clés opaques `sb_secret`, et la régression SQL exécute la finalisation avec des claims JWT vides. Nouvelle CI requise.
- CI finale [37137848450](https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/37137848450) sur la tête exacte : six migrations, cinq suites SQL réussies avec fixtures annulées, security advisors « No issues found », types, 24 tests domaine + 3 configuration, build, 16 parcours desktop/mobile, zéro échec et zéro skip.
- Artifact `browser-evidence` **11278987341** : captures desktop/mobile du fichier encore lisible après révocation du seul dépôt, inspectées sans défaut bloquant.
- La première CI complètement verte avant correction de revue, [37136460197](https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/37136460197), a exécuté les 16 parcours sans skip. Elle ne prouve pas seule les deux corrections ultérieures.

## Limites et risques

Le backend CELESTE OS reste `INACTIVE` et VAL-002 sans réponse explicite. Aucun bucket, migration ou déploiement distant n'a été effectué. Le parcours n'est donc pas présenté comme déployé. La clé serveur doit exister dans l'environnement d'hébergement et ne jamais être préfixée `NEXT_PUBLIC_`.

Le socle protège les fichiers de travail ; il ne constitue pas encore la politique des justificatifs financiers ni la publication immuable des documents métier. Les contributions initiales, l'absence de double comptage caisse, les remboursements désactivés et l'immuabilité des publications restent inchangés.

## Reprise

CE-004 peut maintenant lier catégories, dépenses et justificatifs à ce stockage privé. Après résolution de VAL-002, appliquer uniquement les migrations en attente, créer le bucket privé via migration, rejouer RLS/advisors et vérifier l'environnement email avant tout onboarding.
