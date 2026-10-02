# Correction de précision financière — 2 octobre 2026

Sprint S1 ; CE-002 et CE-005 partiels ; exigence FIN-R01. Branche reprise : `feat/ce-002-foundations`, PR existante #2. Base de travail : `378beeccd9f7456e03c1d109d7756567801f7ffc`. Aucune PR concurrente créée.

## Résultat

La revue automatique https://github.com/Steve-Landry-NONO/Celeste-OS/pull/2#discussion_r4165030924 signalait que le montant accepté `90071992547409,91` perdait un centime à l’affichage. Le formateur partagé `formatEuros` conserve exactement les unités et les centimes, avec la présentation EUR française, sans division flottante. Tous les montants du simulateur utilisent cette fonction : coûts, caisse, contributions, référence, reste et journal. La plage acceptée n’est pas réduite.

Quatre tests de régression couvrent les petits montants, zéro, les négatifs, la limite sûre, le refus des unités fractionnaires et 1 000 montants successifs près de la limite. Le nouveau parcours web teste un versement à la limite, le refus d’un centime supplémentaire sans modification du journal ni des soldes, puis une dépense d’un centime sans nouveau crédit individuel.

## Vérification exécutée

- `npm run check` : réussi, types web/domaine, 18 tests financiers et build des trois routes.
- Contrôle TypeScript séparé du fichier Playwright : réussi.
- `npm run test:e2e` local : lancement des quatre tests, tous bloqués avant interaction car l’exécutable Chromium Playwright requis est absent. Aucun test navigateur local déclaré réussi.
- CI de la base `378beecc` : succès observé, run https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/36998256361. Ce résultat ne prouve pas encore la correction actuelle. Les résultats de la tête poussée sont ajoutés dans la PR après publication du commit.

## Validations et limites

Issue VAL-001, commentaires PR et Gmail ciblé vérifiés. Seul l’email sortant connu `1a0fc206ec1ced41` est présent ; il est exclu comme réponse. Les commentaires de l’agent et la revue du bot ne constituent aucune décision humaine. VAL-001 reste pending ; aucun email supplémentaire ni relance.

Aucun backend, Auth, contrôle RLS, stockage privé, client Expo ou déploiement. La simulation reste fictive et non persistante. Remboursements des fondateurs désactivés ; les règles de contribution et caisse sont conservées. La correction est écrite et testée localement, proposée dans la PR #2 ; elle n’est ni fusionnée ni mise en production.

## Prochaine action et calendrier

Vérifier la CI de la tête et traiter les retours dans cette PR. Dès réponse explicite à VAL-001 : configurer Auth et organisations, tester l’isolation de deux organisations, puis persister les dépenses transactionnellement. Sans backend, poursuivre les contrats indépendants et leurs tests dans le même historique.

Baseline maintenue : recette anticipée le 12 octobre et pilote le 15 octobre 2026, sous réserve d’Auth et persistance. Aucun décalage décidé au jour J1 ; si le backend manque encore le 3 octobre, consigner un calendrier révisé explicite conformément à `planning/SPRINTS.md`.
