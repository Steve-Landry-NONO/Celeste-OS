# ADR-013 — Verrou persistant du remboursement futur

Date : 5 octobre 2026  
Statut : accepté pour CE-006  
Décisions liées : D-003, D-004, Q-002, Q-003, ADR-011, ADR-012

## Contexte

Les dépenses personnelles du pilote sont confirmées comme contributions. Elles ne créent aucune dette envers le payeur. Un régime futur d’avances remboursables est envisagé, mais la réserve minimale de caisse (Q-002) et les approbateurs (Q-003) ne sont pas décidés. Un simple avertissement d’interface ne suffit pas : l’état désactivé doit être persistant et vérifiable en base.

## Décision

Chaque organisation possède une politique `reimbursement_policies` versionnée. La version initiale est provisionnée automatiquement avec les seules valeurs admises par CE-006 :

- statut `disabled` ;
- périmètre `founders` ;
- tolérance d’égalité de zéro centime ;
- réserve, approbateur et référence de décision absents.

La ligne est lisible uniquement avec `finance.read`, isolée par RLS, et immuable même pour le rôle de service. Une suppression directe et un `TRUNCATE` sont refusés ; seule la suppression contrôlée de l’organisation parente emporte sa politique. La base refuse toute valeur `enabled`, toute réserve ou approbation. Aucun RPC de demande, d’activation ou de paiement n’est exposé. La création de la politique ne produit ni coût, ni contribution, ni mouvement de caisse.

L’activation future ne sera pas une mise à jour silencieuse. Elle exigera une décision explicite répondant à Q-002 et Q-003, puis une migration revue qui introduira une nouvelle version de politique et les commandes métier correspondantes. Les anciennes contributions ne seront jamais requalifiées automatiquement.

## Conséquences

Le verrou ne dépend plus d’un texte statique de l’interface. Le lot pilote peut afficher une source persistée tout en restant incapable de rembourser. FIN-05 est couvert pour le refus structurel d’une contribution sous régime désactivé ; la dette distincte d’une avance sous régime actif reste à CE-017 après politique approuvée.

La migration distante reste bloquée par VAL-002. La preuve actuelle porte sur une pile Supabase jetable et ne vaut ni activation, ni déploiement.
