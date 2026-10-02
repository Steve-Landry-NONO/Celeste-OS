# Registre des décisions de CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Statuts

Décidé signifie demandé explicitement par Steve dans la conversation. Proposé signifie choix de ce dossier à confirmer. Vérifié signifie fait observé avec preuve. Une proposition n’est pas une approbation et la génération d’un document ne valide pas son contenu métier.

| ID | Décision | Statut | Source ou conséquence |
|---|---|---|---|
| D-001 | Construire CELESTE OS comme outil central dès maintenant | Décidé | Demande fournie le 2 octobre |
| D-002 | Mobile rapide et DA CELESTE épurée | Décidé | Demande et contexte fournis |
| D-003 | Dépenses initiales retenues en contribution, pas remboursement | Décidé | Correction financière de Steve |
| D-004 | Garder remboursement pour régime futur avec caisse suffisante | Décidé | Demande actuelle |
| D-005 | Catégories dynamiques, coûts par projet et phase | Décidé | Demande financière |
| D-006 | Gestion et versionnement des documents CELESTE et CELESTE OS | Décidé | Demande actuelle |
| D-007 | GitHub central et documentation persistante pour agents | Décidé | Demande actuelle |
| D-008 | Notion Drive Calendar restent remplaçables | Décidé | Demande actuelle |
| D-009 | Pilote utilisable prioritaire à deux semaines | Décidé | Choix explicite lors du cadrage |
| ADR-001 | Next.js Expo TypeScript Supabase comme stack de travail | Proposé | Partage domaine contrats et tokens ; UI web native distinctes |
| ADR-002 | Finance atomique serveur, écritures dérivées et contre-écritures | Proposé | Éviter doublons et préserver audit |
| ADR-003 | GitHub pour docs techniques et catalogue natif pour docs métier | Proposé | Une source éditable par document |
| ADR-004 | Documents natifs et connecteurs facultatifs au pilote | Proposé | Éviter dépendances sans usage établi |
| ADR-005 | Remboursements par avance distincte de contribution | Proposé | Maintenir équité dans régime futur |
| OBS-001 | Compte GitHub Steve-Landry-NONO accessible, aucun dépôt CELESTE trouvé | Vérifié | Recherche repositories et installations le 2 octobre |

## Questions ouvertes et effet

| ID | Question | Hypothèse de travail | Bloque quoi |
|---|---|---|---|
| Q-001 | Lien du dépôt privé CELESTE OS | Nom recommandé celeste-os | Centralisation et code distant |
| Q-002 | Réserve minimale pour rembourser | Non définie, régime désactivé | Activation des remboursements |
| Q-003 | Approbateurs des dépenses et documents | Fondateurs habilités ; remboursement sans auto-approbation | Politique définitive avant données réelles |
| Q-004 | Devise et période d’équilibrage | EUR et période initiale de lancement | Calcul multidevise et clôture réelle |
| Q-005 | Charte logo et typographies sources | Palette provisoire issue des badges | Gel graphique |
| Q-006 | Projets backend hébergement et Expo | Comptes de développement distincts | Déploiement et test natif |
| Q-007 | Vrais montants dépensés et fonds déjà existant | À reconstituer, aucun montant inventé | Import financier réel |

Les questions Q-002 et Q-007 n’empêchent pas de développer les structures et scénarios avec données synthétiques. Elles empêchent de présenter des chiffres réels et d’activer les politiques correspondantes.

## Décisions du démarrage

D-010 décidé : dépôt privé exact Steve-Landry-NONO/Celeste-OS fourni par Steve.
D-011 décidé : plusieurs cycles de développement quotidiens dès aujourd’hui ; cadence proposée et activée à trois reprises.
D-012 décidé : demandes à Steve par email si besoin et conservation des demandes et réponses dans GitHub.
OBS-002 vérifié : GitHub lecture écriture et profil Gmail disponibles ; aucun backend CELESTE OS identifié. Q-001 est résolue, Q-006 reste ouverte pour Auth et persistance.

## Correction de précision — 2 octobre 2026

OBS-003 vérifié : la revue automatique de PR #2 a identifié une perte d’un centime lors de la division flottante pour afficher `90071992547409,91`. La correction applique FIN-R01 jusqu’à l’affichage : partie entière en BigInt et centimes exacts, dans le package partagé. Le périmètre EUR et les règles métier restent ceux du socle. Les tests, preuves et limites sont consignés dans `reports/2026-10-02_PRECISION.md`. Ce constat technique ne constitue aucune validation humaine.
