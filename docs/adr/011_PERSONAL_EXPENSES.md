# ADR-011 — Dépense personnelle confirmée et contribution dérivée

Date : 4 octobre 2026  
Statut : implémenté techniquement, en revue  
Périmètre : CE-004

## Décision

Le premier parcours financier persistant accepte uniquement une dépense personnelle en EUR, confirmée par un administrateur ou un profil Finance actif. Elle référence une catégorie active, un projet ou une mission de la même organisation, un fondateur actif et un justificatif privé déjà finalisé dans ce même périmètre.

La transaction crée la dépense immuable et exactement une écriture de contribution du même montant. Elle ne crée aucune écriture de caisse, dette ou remboursement. Une clé UUID et le payload canonique rendent une relance identique sans effet supplémentaire ; la même clé avec un payload différent est refusée.

## Motifs

FIN-R02 impose coût et contribution sans mouvement de caisse. Lier le justificatif par contraintes composées évite qu’un identifiant valide d’une autre organisation ou mission soit réutilisé. Les écritures confirmées et leur projection sont non modifiables ; une correction future passera par contre-écriture.

Les dépenses payées par le fonds, versements et remboursements ne sont pas simulés avec ce modèle partiel. Ils nécessitent les comptes et mouvements atomiques de CE-005/006.

## Sécurité et exposition

Les nouvelles tables publiques ont RLS et grants explicites : lecture uniquement aux profils dotés de `finance.read`, aucune écriture directe authentifiée. Les deux commandes passent par des fonctions privilégiées qui relisent `auth.uid()`, l’appartenance et `finance.confirm`. Les profils et metadata client ne confèrent aucun droit.

Le changement Supabase annoncé pour le 30 octobre 2026 sépare les grants de la RLS ; la migration déclare donc les deux couches explicitement.

## Limites

Le lot ne gère ni brouillons, ni propositions par les membres, ni sous-catégories dans l’interface, ni caisse, ni remboursement, ni import réel. Aucun montant CELESTE réel n’est saisi. Le backend distant reste inchangé tant que VAL-002 bloque sa restauration.

