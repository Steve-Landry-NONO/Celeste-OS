# Documentation et mémoire persistante pour les agents

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Répartition de la vérité

Les spécifications décrivent le comportement attendu. Les ADR décrivent les raisons des choix. Le backlog décrit le travail à faire. L’état décrit ce qui est réellement terminé et bloqué. Les rapports et PR portent les preuves. Les échanges de chat apportent des instructions, ensuite traduites dans les fichiers concernés pour durer.

## Documents à maintenir

| Fichier ou dossier | Contenu | Quand le mettre à jour |
|---|---|---|
| AGENTS.md | Procédure de reprise et contraintes | Changement du workflow ou des règles d’agent |
| memory/CONTEXT.md | Exigences durables et faits acquis | Nouvelle instruction durable |
| memory/STATE.json | Sprint, issue, base vérifiée, blocages et prochaine action | Chaque session |
| memory/HANDOFF.md | Résultat récent et reprise concrète | Chaque session |
| docs/DECISIONS.md et docs/adr | Choix et questions ouvertes | Décision ou changement important |
| planning/backlog.csv | Priorités, dépendances, critères et état | Début et fin d’incrément |
| reports | Résultats datés et tests réellement exécutés | Chaque session |
| CHANGELOG.md | Comportements livrés par version | À la release ou au changement livré |
| docs/11_RECETTE.md et preuves PR | Scénarios et résultats | Exigence nouvelle et recette |
| docs/registry.json | Index et versions des documents | Modification d’un document de référence |

## Hiérarchie et conflits

Une instruction actuelle de Steve prime sur ce lot initial. Une décision nouvelle indique quelles règles elle remplace et sa date d’effet. Si deux fichiers divergent, l’agent traite l’ambiguïté avant la mutation sensible et corrige les résumés. Les docs ne restent pas « approuvées » après changement substantiel sans nouvelle revue.

Le fichier STATE est court, machine lisible et vérifié. Il n’archive pas tout le chat, secrets ou données financières personnelles. Les identifiants stables des exigences et issues assurent la traçabilité malgré les renommages. Les anciens rapports restent datés, jamais réécrits pour inventer un avancement.

## Boucle quotidienne

Reprise puis lecture de l’issue, implémentation, vérification, PR, mise à jour mémoire et rapport. Rapport destiné à Steve dans le fil ou la PR ; aucun envoi à des tiers par défaut. Le temps écoulé n’autorise aucune décision qui attendait une validation. En cas d’outil absent, annoncer le blocage et la prochaine action sans prétendre avoir exécuté du code.

## CI documentaire prévue

Vérifier liens relatifs, structure du STATE, IDs des exigences, clés du backlog et absence de secrets. Une PR fonctionnelle doit référencer au moins un besoin et indiquer les documents affectés. Les checks ne peuvent pas juger seuls la qualité métier d’un CDC ; la revue humaine reste attachée à la version.

## Publication des documents dans CELESTE OS

Après le développement du catalogue, importer les documents de référence avec leur version et provenance GitHub. Une release associe commit et versions du CDC, de finance et des permissions. L’application rend ces références consultables selon le rôle ; elle n’accorde pas un accès au dépôt aux prestataires pour leur permettre de lire un contrat partagé.
