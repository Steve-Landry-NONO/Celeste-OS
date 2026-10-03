# Rôles et permissions de CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Principe

Une permission combine une capacité et un périmètre : organisation, espace, projet, mission ou document. Être connecté ne donne pas accès à toute l’organisation. Une appartenance suspendue ou révoquée refuse toute nouvelle opération. Les actions sensibles relisent l’état effectif. Les trois fondateurs partagent la lecture financière globale dans la proposition de pilote ; leurs droits d’écriture sont explicites et auditables.

## Matrice de départ

| Action | Fondateur admin | Fondateur finance | Membre équipe | Support | Prestataire |
|---|---|---|---|---|---|
| Lire projets et tâches | Organisation | Organisation | Projets accordés | Périmètre accordé | Mission uniquement |
| Créer ou modifier tâches | Selon capacité | Selon capacité | Dans projet accordé | Si capacité accordée | Ses actions autorisées |
| Lire coûts et contributions globaux | Oui | Oui | Non par défaut | Non | Non |
| Proposer une dépense | Oui | Oui | Pour son périmètre | Si accordé | Non par défaut |
| Confirmer écritures et versements | Si finance accordée | Oui | Non | Non | Non |
| Approuver remboursement | Si habilité et non bénéficiaire | Si non bénéficiaire | Non | Non | Non |
| Lire paiements prestataire | Tous si finance | Tous | Si accord explicite | Non par défaut | Les siens uniquement |
| Lire document et fichier | Selon scope | Selon scope | Partagé | Partagé | Partagé à la mission |
| Proposer version documentaire | Selon scope | Selon scope | Si éditeur | Si éditeur | Ses livrables |
| Publier document | Si publisher | Si publisher | Si délégué | Non par défaut | Non |
| Administrer membres et droits | Oui | Non par défaut | Non | Non | Non |
| Lire audit de l’organisation | Oui si audit | Si finance audit | Non | Non | Non |

Le titre de fondateur n’est pas un raccourci implicite dans le code. L’administration technique et la confirmation financière peuvent être séparées. Un admin ne peut pas rendre publiques des ressources contractuelles par un simple changement de tag.

## Capacités proposées

project.read, project.write, task.assign, expense.submit, finance.read, finance.confirm, contribution.record, reimbursement.approve, reimbursement.pay, document.read, document.write, document.review, document.publish, mission.manage, membership.manage, audit.read. Les codes finaux sont générés depuis un contrat partagé pour empêcher des divergences web et mobile.

## Implémentation attendue

RLS sur les tables exposées, grants minimaux, politiques SELECT, INSERT, UPDATE et DELETE distinctes. UPDATE vérifie ancien et nouveau périmètre. Les relations organisation parent enfant sont protégées au niveau base. Les fonctions privilégiées doivent avoir un besoin justifié, des droits EXECUTE limités et un contrôle acteur ; ne pas résoudre un refus d’accès en désactivant RLS.

L’accès aux objets privés stockage suit les versions et missions. Les URL courtes sont générées après vérification du droit de lecture. Les profils prestataires ne lisent pas les tableaux globaux, budgets, emails de tiers, notes internes ou historique des autres missions. Recherche, compteurs, export, notifications et activité suivent les mêmes règles.

## Cas de test obligatoires

Refus entre deux organisations ; prestataire A refusé sur mission B ; membre refusé sur finance ; bénéficiaire refusé sur approbation propre ; utilisateur révoqué refusé sur confirmation ; déplacement d’une tâche refusé vers un projet non autorisé ; document lisible mais version non partagée refusée ; lien expiré inutilisable ; export limité ; agrégats sans fuite de totaux globaux. Les tests portent sur l’API directe, pas seulement les menus masqués.

## Premier contrat implémenté — ADR-009

La lecture projet/mission explicite utilise `private_celeste.can_read_scope`. Aucun héritage; équipe/support par accord, prestataire par mission uniquement, administrateurs/Finance sur organisation. Seul un admin actif crée des périmètres et gère les accords, avec version et audit atomiques. Les droits de fichiers, tâches, écritures financières et publication restent à implémenter et tester séparément. Voir le rapport SCOPES pour la preuve effective.
