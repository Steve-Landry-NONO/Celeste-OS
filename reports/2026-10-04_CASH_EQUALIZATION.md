# Rapport CE-005 — caisse et égalisation

Date : 4 octobre 2026  
Branche : `feat/ce-005-cash-ledger`  
PR : [#9](https://github.com/Steve-Landry-NONO/Celeste-OS/pull/9)  
État : implémentation vérifiée en CI et fusionnée par PR #9 ; non déployée

## Résultat

- caisse EUR à solde initial nul ;
- versement atomique : une contribution et une entrée de caisse ;
- dépense du fonds : un coût et une sortie de caisse, aucune contribution ;
- avoir fournisseur : baisse du coût net et retour sur la même caisse ;
- référence d’égalisation et reste à apporter dérivés pour les fondateurs actifs ;
- historique des contributeurs non actifs conservé ;
- écritures immuables, idempotence, RLS, grants explicites et isolation organisation/périmètre ;
- écran Finance étendu avec totaux, soldes et quatre formulaires contrôlés ;
- remboursements de personnes toujours désactivés.

## Contrôles

La [CI 37286210732](https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/37286210732) passe sur la tête de code `7a024d1945ec346f1da4e7c36839d9310bf4fc98` :

- huit migrations appliquées sur une pile Supabase jetable ;
- sept suites SQL avec rollback, dont l’exemple financier exact, l’idempotence, le solde insuffisant, l’avoir plafonné, l’immuabilité et l’isolation ;
- security advisors sans avertissement ni erreur ;
- contrat TypeScript, 24 tests domaine et 3 tests de configuration ;
- build Next.js ;
- 18 parcours Playwright desktop/mobile, 0 échec et 0 skip ;
- artifact `browser-evidence` 11334402484 ; captures Finance desktop/mobile inspectées sans défaut bloquant.

Une première CI a utilement refusé le lot avant navigateur car le contrat TypeScript ne décrivait pas les nouvelles tables. Ce contrat et l’appel explicite de `cash_equalization.sql` par le workflow ont été corrigés. La revue P2 a ensuite relevé qu’un total d’organisation pouvait dépasser la plage entière sûre tout en restant valide par fondateur et par caisse. Une garde transactionnelle couvre désormais coût net, caisse et contributions ; une régression à deux fondateurs et deux caisses prouve le refus atomique. Le fil a été répondu et résolu après la CI complète ci-dessus.

## Risques et blocages

La base distante CELESTE OS reste INACTIVE. VAL-002 n’a reçu aucune réponse humaine explicite ; aucune migration distante, donnée réelle ou publication n’a donc été effectuée. Le seul courriel pertinent retrouvé est l’envoi déjà journalisé, exclu avant interprétation. Aucune relance n’a été envoyée.

Les montants réels et soldes réels ne sont pas fournis. La caisse ne reçoit donc aucun solde d’ouverture fictif. Les avoirs sont plafonnés au coût de la dépense d’origine et les sorties de caisse sont refusées si le solde est insuffisant.

## Calendrier

La cible initiale reste le 12 octobre pour la recette anticipée et le 15 pour le pilote comme baseline. La prévision distante demeure conditionnelle : recette utilisateurs le 14 et pilote le 17 si le backend est réactivé au plus tard le 5 octobre à midi ; ensuite décaler d’au moins un jour par jour de blocage supplémentaire.

## Prochaine action

Démarrer CE-006 : verrou persistant du régime de remboursement futur, sans endpoint d’activation ni remboursement. VAL-002 reste requise avant toute migration distante.
