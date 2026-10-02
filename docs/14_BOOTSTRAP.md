# Initialisation du développement de CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Avant le premier code

1. Confirmer le lien du dépôt CELESTE OS privé et son caractère distinct de la marketplace. Ne pas modifier un dépôt proche par déduction.
2. Ajouter ce dossier dans la branche de départ, conserver les identifiants des exigences et créer les issues depuis le backlog.
3. Vérifier les instructions AGENTS existantes avant de choisir les versions et commandes.
4. Décider Next.js et Expo ou Expo universel avec un essai court sur les parcours documents et finance, puis mettre à jour ADR-001.
5. Vérifier backend de test, hébergement et connexion mobile, sans créer de ressources payantes non décidées.
6. Créer le monorepo, fixer versions, générer lockfile et documenter les commandes réellement exécutées.
7. Configurer Auth, schéma et RLS dans l’environnement de test, tester deux organisations avant interface réelle.
8. Installer CI pour types, lint, domaine, base et build. Ajouter scans de secrets et dépendances si disponibles.
9. Livrer un parcours de connexion réel puis démarrer CE-004 et CE-005 pour la finance.

## Registre des commandes

| Action | Commande | État |
|---|---|---|
| Installation | À renseigner après scaffold et choix du gestionnaire | Non exécutée |
| Web local | À renseigner après scaffold | Non exécutée |
| Mobile local | À renseigner après scaffold | Non exécutée |
| Tests domaine | À renseigner après création du package | Non exécutés |
| Tests RLS | À renseigner après environnement Supabase | Non exécutés |
| Build web et mobile | À renseigner après initialisation | Non exécuté |

Ne pas copier des commandes supposées fonctionnelles dans le README. Vérifier la documentation officielle de la version retenue et la sortie réelle, puis enregistrer les commandes et limites. Les migrations suivent la procédure courante du fournisseur et sont commitées avec leurs tests.
