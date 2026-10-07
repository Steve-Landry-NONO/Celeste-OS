# ADR-014 — Tâches persistées et vue Aujourd’hui

Date : 7 octobre 2026  
Statut : accepté pour CE-007  
Décisions liées : ADR-009, TASK-01, TODAY-01

## Contexte

Le contrat métier de la vue « Aujourd’hui » existait déjà dans le domaine, mais seulement sur des données fictives. Les projets et missions persistés disposent d’un droit de lecture explicite, sans héritage entre projet et mission. Ce droit ne doit pas devenir implicitement un droit d’écriture métier.

## Décision

Une phase appartient à un projet. Une tâche appartient à un périmètre projet ou mission et peut référencer une phase du même projet. Elle possède exactement un responsable, membre actif de l’organisation. Le passage à l’état `blocked` exige un motif non vide ; les autres états refusent ce motif. Les changements utilisent une version attendue et produisent un historique append-only.

Le droit `task_write` est séparé de la lecture et du dépôt de fichiers. Un administrateur actif peut le déléguer à un membre qui lit déjà le périmètre ; un prestataire ne peut le recevoir que sur une mission. Le délégataire peut créer une tâche pour lui-même et modifier les tâches du périmètre, mais seul `task.assign` permet de changer le responsable ou de créer une tâche pour autrui. La révocation de la lecture révoque aussi l’écriture des tâches. Les administrateurs conservent l’écriture et l’assignation sur les projets et missions de leur organisation. Aucun droit ne s’hérite du projet vers ses missions.

Les tables publiques utilisent RLS et des privilèges explicites. Les commandes privées `SECURITY DEFINER` ne sont pas exécutables par les rôles clients ; des wrappers publics à chemin de recherche vide effectuent l’entrée contrôlée. Chaque commande relit l’identité et les droits en base. La vue Aujourd’hui et la progression sont calculées à partir des mêmes tâches lisibles : tâches personnelles dues ou en retard pour Aujourd’hui, tâches annulées exclues de la progression.

## Conséquences

TASK-01 et TODAY-01 deviennent vérifiables sur une base persistée sans élargir les accès projet/mission. Le responsable unique, le motif de blocage, la concurrence optimiste et l’isolation interorganisation sont imposés côté base, indépendamment de l’interface.

La migration distante reste bloquée par VAL-002. La preuve courante porte sur la pile Supabase jetable de CI et ne vaut ni déploiement, ni onboarding utilisateur. Aucune règle de contribution, caisse, remboursement ou document publié n’est modifiée.
