# Configurer et vérifier la connexion
Version 0.1.4 · 3 octobre 2026 · Auth/membres fusionnés en PR #2 ; annuaire en PR #3

## Environnement web
Copier apps/web/.env.example vers apps/web/.env.local, puis renseigner la clé publiable du projet CELESTE OS (vxdneuoglidyngzdfmjc). Utiliser NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, jamais une clé secret ou service_role. APP_URL doit être l’origine exacte du site (HTTPS en ligne, HTTP autorisé seulement sur localhost/127.0.0.1).

Le dépôt contient uniquement un exemple sans clé réelle. Sans configuration valide, l’application présente un état de préparation et bloque la connexion.

Les routes /login, /register, /auth/callback et /workspace utilisent les comptes et organisations persistés. /today et /lab restent des démonstrations fictives indépendantes. Créer un compte ne donne pas accès à un espace existant ; seul un administrateur peut ajouter un membre.

## Projet distant
Migrations Auth déjà appliquées : 20261002172913_auth_organizations et 20261002174348_activity_actor_index. Annuaire observé appliqué en 20261003082224_admin_member_directory, vérifié identique à la PR #3. Une migration d’invitations est également observée en 20261003082235_organization_invitations ; ses travaux sont préservés mais hors preuve de la PR annuaire. Ne pas rejouer ces migrations manuellement sur le projet distant. Vérifier l’historique avant tout futur db push ; ne jamais lancer db reset contre la base distante.

Les paramètres Auth distants n’ont pas été modifiés. Avant le pilote, configurer dans Auth les Site URL et Redirect URLs pour l’origine déployée et son /auth/callback, vérifier la confirmation d’email, les modèles de mail et le transport SMTP. Ne pas désactiver la confirmation distante pour contourner la recette. Le callback accepte le code PKCE dans le même navigateur ou le token_hash de confirmation, puis redirige vers une destination fixe.

Aucun compte réel n’a été inscrit pendant cette recette. Les 26 assertions SQL utilisent des identités .invalid dans une transaction annulée ; le contrôle final observe zéro utilisateur, organisation ou membre de test.

## Reproduction locale et CI
Prérequis supplémentaires : Docker et psql. npm ci installe Supabase CLI 2.119.0. La CI sélectionne des ports libres et un identifiant de pile par exécution, puis démarre un Supabase local Postgres 17, rejoue les migrations sur sa base jetable, puis exécute :

```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -X -v ON_ERROR_STOP=1 -f supabase/tests/auth_organizations.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -X -v ON_ERROR_STOP=1 -f supabase/tests/member_directory.sql
npm run check
npx playwright install --with-deps chromium
npm run test:e2e
```

La CI configure les variables à partir de supabase status via scripts/ci-supabase-env.mjs. Les tests Auth ne s’exécutent que si CELESTE_E2E_REAL_AUTH=1 et refusent toute URL hors loopback ; leur clé administrative sert uniquement à créer et nettoyer des fixtures locales. La confirmation est désactivée dans la seule configuration locale jetable. Les mails et l’onboarding des vrais fondateurs restent une recette distante distincte.

Sans pile locale configurée, les quatre parcours Auth sont indiqués skipped ; les quatre tests de démonstration restent exécutables. Un résultat avec skip ne valide pas la connexion réelle. Le rapport AUTH conserve la preuve CI effective : huit tests passés sans skip sur ac0a15f8c7e7170362580f66b091771195cd1d8a.

## Avis Supabase
Aucun WARN/ERROR à la dernière inspection. INFO RLS sans policy sur private_celeste.role_permissions est volontaire : table privée, refus client par défaut, lecture par fonctions privées contrôlées. INFO index inutilisés est attendu sur activity_events vide. L’index de sa FK actor_id a été ajouté. Références : [RLS sans policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) et [index inutilisé](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

## Administration des membres — 3 octobre 2026
Depuis Mes espaces, un administrateur actif ouvre Gérer les membres. Chaque carte permet de choisir un rôle et un accès actif/suspendu, puis Enregistrer l’accès. Le dernier administrateur doit rester actif ; un conflit de version demande de recharger. La page et les Server Actions relisent les droits, sans clé administrative. Les comptes sont identifiés par référence, sans accès étendu aux profils. La PR #3 ajoute les noms autorisés ; les invitations restent à construire.

La CI de CE-003 (37108614505, code 0a23faf) passe dix tests sans skip : quatre démos, quatre Auth et deux administration desktop/mobile. Sans pile Auth locale, six parcours sont skipped et ne fournissent aucune preuve d’accès persisté. Aucune migration nouvelle pour cette UI.

## Annuaire administratif
La troisième migration ajoute list_organization_members : une RPC privée contrôlée par membership.manage et un wrapper public SECURITY INVOKER. Elle renvoie les appartenances et noms de cet espace uniquement ; profiles reste limité au profil propre et aucun email n’est renvoyé. La CI rejoue aussi supabase/tests/member_directory.sql. Déjà observée appliquée en version 20261003082224 : ne pas la réappliquer. CI 37109445474 passée, tests annuaire distants avec ROLLBACK passés, zéro fixture résiduelle ; preuves dans reports/2026-10-03_DIRECTORY.md.
