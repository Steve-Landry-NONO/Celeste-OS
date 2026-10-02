# Cahier des charges de CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Périmètre du produit

CELESTE OS doit réunir pilotage, coordination, finance et connaissance documentaire. Les ressources appartiennent à une organisation, éventuellement à un espace, un projet ou une mission. La marketplace CELESTE demeure un produit distinct ; on peut la suivre comme projet dans CELESTE OS sans fusionner ses clients et données avec les données internes.

## Exigences fonctionnelles

| ID | Domaine | Comportement attendu | Livraison | Scénario de recette |
|---|---|---|---|---|
| REQ-01 | Comptes et organisation | Invitation, connexion, récupération d’accès, membres et périmètres | Pilote | AUTH-01 |
| REQ-02 | Aujourd’hui | Tâches, validations, réunions et échéances réellement autorisées | Pilote | TODAY-01 |
| REQ-03 | Projets et roadmap | Projets, phases, jalons, tâches et responsables uniques | Pilote puis enrichissement | TASK-01 |
| REQ-04 | Dépenses | Catégories dynamiques, justificatifs, source de fonds, phase et historique | Pilote | FIN-01 |
| REQ-05 | Contributions et caisse | Apports, dépenses personnelles, écarts et solde distincts | Pilote | FIN-02 |
| REQ-06 | Remboursements | Régime futur explicite, demandes, validations et paiements partiels | Modèle pilote et activation ultérieure | FIN-05 |
| REQ-07 | Documents versionnés | Documents CELESTE et CELESTE OS, versions immuables, approbation et référence | Pilote | DOC-01 |
| REQ-08 | Prestataires | Mission restreinte, livrables et échéances de paiement | Pilote | ACL-02 |
| REQ-09 | Réunions | Participants, ordre du jour, décisions et actions liées | Pilote | MEET-01 |
| REQ-10 | Notifications et activité | Activité persistée et notifications internes limitées au périmètre | Pilote | ACT-01 |
| REQ-11 | Mobile | Navigation à une main et client iOS Android sur backend commun | Pilote | MOB-01 |
| REQ-12 | Intégrations | Fournisseurs remplaçables, synchronisations idempotentes | Après preuve de besoin | INT-01 |
| REQ-13 | Collaboration et IA | Commentaires, messagerie, synthèses et propositions traçables | Versions suivantes | AI-01 |
| REQ-14 | Mémoire de développement | Contexte, décisions, backlog, état et preuves repris dans GitHub | Dès cadrage | MEM-01 |

## Exigences de qualité

| ID | Exigence | Preuve attendue |
|---|---|---|
| NFR-01 | Isolation entre organisations et missions, refus par défaut | Tests d’API, RLS, fichiers et agrégats avec deux organisations et deux prestataires |
| NFR-02 | Opérations monétaires atomiques et idempotentes | Double soumission et exécution concurrente sans double effet |
| NFR-03 | Traçabilité des validations, corrections et droits | Événement daté avec acteur et références, accessible uniquement aux profils habilités |
| NFR-04 | Parcours lisibles dès 360 pixels de largeur | Recette téléphone, clavier, grossissement du texte et captures réelles |
| NFR-05 | Chargements compréhensibles et erreurs récupérables | Échec réseau, session expirée et téléversement interrompu sans fausse réussite |
| NFR-06 | Aucune donnée inventée dans les comptes réels | Démonstration isolée et marquée, totaux nuls ou indisponibles avant saisie |
| NFR-07 | Sauvegarde de base et fichiers avec restauration | Rapport de restauration et limites documentées |
| NFR-08 | Contexte et documentation cohérents avec le code | PR contenant exigences, tests, migrations et état mis à jour |
| NFR-09 | Déploiement reproductible et retour arrière | Version identifiable, lockfile, migration testée et procédure de retour |
| NFR-10 | Modifications simultanées maîtrisées | Version attendue, conflit affiché et absence d’écrasement silencieux |

La cible d’accessibilité est WCAG 2.2 AA, à vérifier par une revue dédiée ; ce dossier ne constitue pas une certification. Les objectifs de temps de réponse seront fixés après mesure d’un pilote sur un téléphone et réseau de référence, plutôt que d’inventer une performance initiale.

## Fin de livraison

Une fonctionnalité est livrée lorsqu’elle a une interface utilisable, des données persistées, des autorisations vérifiées et une preuve de recette. Une maquette, un bouton inactif ou un état uniquement conservé dans le navigateur ne suffit pas. La validation métier de Steve ne remplace pas les contrôles automatiques et une CI verte ne remplace pas la recette des fondateurs.

## Gestion des changements

Toute évolution conserve un ID d’exigence et une version cible. Un changement de calcul, d’accès, de devise, de fournisseur ou de cycle de validation met à jour les spécifications et une décision d’architecture. Les dépendances externes ne sont activées qu’après un besoin démontré et l’accès confirmé. Le backlog versionné sert de référence si GitHub Projects n’est pas disponible.
