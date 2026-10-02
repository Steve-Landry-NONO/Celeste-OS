# Plan de vérification et recette de CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Stratégie

Les tests ciblent les calculs financiers, autorisations, transitions documentaires et parcours persistés. Les changements graphiques simples se vérifient visuellement sans tests qui recopient l’implémentation. Chaque preuve précise version de code, environnement, date, commande ou procédure, résultat et limite.

| ID | Scénario | Résultat attendu |
|---|---|---|
| AUTH-01 | Invitation valide puis réutilisation, expiration et révocation | Invitation utilisée une fois ; opérations sensibles refusées après révocation |
| TODAY-01 | Tâches dues, retard et changement de fuseau | Classement conforme et compteurs sur même périmètre |
| TASK-01 | Créer tâche, attribuer, bloquer et terminer | Un responsable, motif de blocage et historique persistés |
| FIN-01 | Saisir dépense personnelle avec nouvelle catégorie et photo | Coût et contribution augmentés ; caisse inchangée |
| FIN-02 | Exécuter l’exemple financier du document FINANCE | Coût 2 100, caisse 1 500, contributions 1 200 chacune |
| FIN-03 | Confirmer deux fois et envoyer requêtes concurrentes | Un seul effet par commande ; conflit si payload change |
| FIN-04 | Fonds paie une dépense puis fournisseur rembourse au fonds | Contribution inchangée, coût net et caisse corrects |
| FIN-05 | Demande sur contribution puis avance remboursable sous régime actif | Contribution non remboursable refusée ; dette distincte pour avance |
| FIN-06 | Rembourser partiellement puis au-delà de dette ou réserve | Premier paiement exact ; dépassements refusés atomiquement |
| FIN-07 | Retrait d’apport et remboursement personnel fournisseur | Contributions nettes et nouvelle référence recalculées sans effacer historique |
| FIN-08 | Devise différente et dépense non confirmée | Aucun mélange de devises ni inclusion en coûts payés |
| DOC-01 | Déposer, publier deux versions puis ouvrir l’ancienne | Octets et empreintes de l’ancienne inchangés |
| DOC-02 | Modifier après approbation et publier concurremment | Nouvelle revue obligatoire et une seule version courante |
| DOC-03 | Transfert interrompu, fichier actif et MIME trompeur | Pas de publication vide ; fichier interdit refusé ou quarantainé |
| ACL-01 | Deux organisations avec IDs manipulés en API | Lecture écriture recherche export et totaux refusés hors scope |
| ACL-02 | Deux prestataires et deux missions avec documents distincts | Chaque prestataire voit seulement sa mission et fichiers partagés |
| ACL-03 | Révoquer accès puis lire activité et notifications | Aucune nouvelle donnée inaccessible divulguée |
| MEET-01 | Réunion avec décision puis tâche liée | Lien bidirectionnel et participants autorisés |
| ACT-01 | Opération métier puis notification traitée deux fois | Un audit métier et notification sans doublon |
| MOB-01 | Téléphone, clavier, photo, réseau perdu et retour | Pas de contenu masqué ni fausse réussite, brouillon réutilisable |
| INT-01 | Événement rejoué et connecteur révoqué | Pas de doublon et échec explicite sans perdre donnée locale |
| MEM-01 | Nouvelle session agent depuis un clone propre | Tâche suivante trouvée sans besoin de relire le chat |
| OPS-01 | Restaurer base et versions fichiers dans test isolé | Totaux, droits, documents et empreintes cohérents |
| AI-01 | Futur assistant questionne document privé puis propose dépense | Refus hors droits et aucune écriture sans validation métier |

## Types de preuves

Tests unitaires du domaine pour monnaie et transitions ; tests SQL et API pour RLS et transactions ; parcours navigateur pour web ; vérification sur appareil pour mobile ; recette des trois fondateurs pour compréhension. Les fixtures utilisent des nombres fictifs et deux organisations. Les tests d’une future fonctionnalité restent « non exécutés » tant qu’elle n’existe pas.

## Critères d’ouverture du pilote

Tous les scénarios applicables aux fonctions livrées sont passés. Aucun défaut critique sur autorisation, finance, perte de données ou document courant. Les risques restants et fonctions incomplètes sont écrits. Les utilisateurs savent comment signaler une anomalie. Sauvegarde et restauration sont vérifiées ou l’accès reste limité à des données de test. Steve donne la décision d’ouverture sur une release identifiable.

## État au cadrage

La cohérence du dossier et ses fichiers peut être vérifiée ; aucun test applicatif n’a été exécuté, aucun score de couverture n’est annoncé, aucun pilote n’est déclaré en production.
