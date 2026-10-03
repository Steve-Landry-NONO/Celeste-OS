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

## Premier résultat CI et correction

Le run 36997354319 confirme installation, types, 14 tests domaine et build. Les deux tests navigateur atteignent le contrôle d’insuffisance de caisse, puis échouent sur un sélecteur `alert` ambigu avec l’annonceur de navigation Next.js. L’erreur attendue du formulaire est bien présente dans les logs. Le sélecteur est limité au formulaire ; recette relancée sans retries automatiques. Les rapports et captures seront conservés comme artifacts GitHub pendant 14 jours.

## Résultat final de recette

Run 36997842066 réussi sur `c6b01e7a21cd1f0853316610e2457ee53b352a32` : installation, types, 14 tests domaine, build et 2 tests navigateur passés (4,8 s pour la recette navigateur). Le défaut du sélecteur est corrigé. Les captures d’accueil desktop et du laboratoire mobile ont été téléchargées et inspectées : contenu lisible, rendu complet et données explicitement fictives. La recette ne vérifie pas les couches API/base absentes.

Preuve : https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/36997842066. Artifact `browser-evidence` ID 11221864974, conservation 14 jours. Les références de run et les logs GitHub restent la preuve d’exécution. L’actualisation finale ne modifie que la documentation et la mémoire. PR #2 reste ouverte, aucune fusion ou publication effectuée. VAL-001 toujours pending ; le thread vérifié ne contient que l’email sortant connu, aucune réponse reçue.
