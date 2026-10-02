# Cycle de fondations — 2 octobre 2026

Branche : `feat/ce-002-foundations`. Base : `c444e6c765a7bf5db0c14b1e6119721dfbf36a90`. Exigences : CE-002 partiel, FIN-R01/02/03/04/09/10 et verrou du remboursement futur. Incrément proposé en PR, non fusionné et non déployé au moment du rapport.

## Comportement

Client Next.js responsive : `/`, `/documents` et `/lab`. Le catalogue ouvre les spécifications GitHub ; il ne gère pas encore des documents métier ni leurs approbations. Le simulateur possède ses propres fondateurs fictifs et journal éphémère. Aucun stockage ni appel financier réel.

Moteur partagé : dépenses personnelles, versements, dépenses du fonds et remboursements fournisseurs partiels liés. Centimes entiers sûrs, journal immuable, retries identiques sans duplication, payload modifié refusé. Le régime de remboursement des fondateurs est désactivé. La contribution maximale détermine les écarts, sans décision sur les parts juridiques.

## Preuves exécutées

| Contrôle | Résultat |
|---|---|
| `npm ci --no-audit --no-fund` après nettoyage des caches générés | Réussi, 38 packages |
| `npm run typecheck` | Réussi : Next typegen puis tsc web et domaine |
| `npm test` | 14 réussis, 0 échec, aucun skipped |
| `npm run build` | Réussi, routes statiques et icône |
| Serveur local et requêtes HTTP `/`, `/documents`, `/lab` | HTTP 200 et texte SSR attendu sur les trois |
| `npx playwright test --list` | Deux tests détectés : desktop et mobile-web |
| Navigateur local agent-browser / Chromium Playwright | Bloqué : création socket Unix interdite, pas de résultat interactif |
| CI distante | Configurée ; résultat à consulter sur la PR |
| API, Auth, RLS, fichiers, concurrence SQL et mobile natif | Non exécutés : dépendance backend / client Expo |

Le scénario fictif complet donne 210000 centimes de coûts, 150000 de caisse et 120000 de contribution pour chacun. Les tests couvrent retries, entrées invalides, dépassement de caisse, devise, référence de remboursement, limites cumulées, retours vers caisse ou personne et immutabilité. Les commits ne contiennent aucune écriture réelle.

## Revue des composants

Pages statiques côté serveur ; seul le simulateur est client. État dérivé sans effet, initialisation paresseuse, labels et messages d’erreur liés, navigation sémantique, lien d’évitement, focus visible. Aucune API métier à prétendre autorisée. La recette mobile interactive et l’accessibilité navigateur restent à confirmer sur un environnement permettant Chromium.

## Validation et suite

VAL-001 (#1) ouverte et email envoyé à Steve, événements conservés sans décision déduite. Exclure les messages sortants et leur texte cité des réponses interprétées. Poursuivre après identification du backend dédié : Auth, RLS et persistance transactionnelle. L’idempotence en mémoire n’est pas une preuve d’atomicité SQL.

## Publication vérifiée

Commit de code : `68a0549e89a2bc0022112a207b9dca1508eb8ea2`. PR : https://github.com/Steve-Landry-NONO/Celeste-OS/pull/2. CI lancée : https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/36997354319. Ce lien décrit la première exécution ; la PR donne les checks de la tête courante après actualisation documentaire.
