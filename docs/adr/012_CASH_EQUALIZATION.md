# ADR-012 — Caisse et égalisation par écritures distinctes

Date : 4 octobre 2026  
Statut : implémenté et vérifié en CI sur la branche CE-005

## Décision

Une caisse commence toujours à zéro. Un solde réel ne peut apparaître que par des mouvements confirmés et traçables.

- une dépense personnelle crée un coût et une contribution, sans caisse ;
- un versement crée exactement une contribution et une entrée de caisse, sans coût ;
- une dépense du fonds crée un coût et une sortie de caisse, sans contribution ;
- un avoir fournisseur réduit le coût net et revient sur la caisse d’origine, sans modifier les contributions.

Les totaux sont dérivés des écritures et ne sont jamais saisis ni stockés comme une seconde vérité. La référence d’égalisation est la contribution maximale des fondateurs actifs. Le reste à apporter est positif ou nul ; aucun écart négatif ne déclenche de remboursement.

## Atomicité et sécurité

Chaque commande financière lie une clé d’idempotence à son payload complet. Une répétition identique rend le même résultat ; une réutilisation avec un payload différent échoue. L’organisation et la caisse sont verrouillées pendant la transaction afin de sérialiser les contrôles de solde, les versements et les avoirs.

Les écritures confirmées sont immuables. Les tables exposées ont RLS et grants explicites ; les insertions passent par des fonctions contrôlées par `finance.confirm`. Un justificatif privé prêt du même projet ou de la même mission reste obligatoire pour toute dépense. Les lectures et commandes restent isolées par organisation.

## Remboursements

Un avoir fournisseur n’est pas un remboursement de fondateur. Le remboursement d’une personne reste désactivé et aucun endpoint ne l’expose tant que sa politique n’est pas décidée. Une correction future devra être une contre-écriture, jamais une modification d’une écriture confirmée.

## Conséquences

L’écran Finance peut afficher séparément coût net, caisse, contributions, référence et reste à apporter. Le backend distant n’est pas migré tant que VAL-002 n’est pas explicitement résolue. La validation technique repose jusque-là sur la pile Supabase jetable de CI.
