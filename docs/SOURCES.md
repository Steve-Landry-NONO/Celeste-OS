# Sources et provenance du dossier CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Sources métier

Contexte externe et demande utilisateur fournis le 2 octobre 2026 : vision produit, choix mobile, direction artistique, investissement des fondateurs, remboursements futurs, catégories, documentation persistante et cible de deux semaines. Choix supplémentaire pendant le cadrage : pilote utilisable prioritaire.

Document actuel consulté : CELESTE_Badges_Salon_Mariage.pdf, fichier historique du 4 septembre 2026. Source visuelle pour ivoire, doré, terracotta et texte sombre. Ce document n’a pas été considéré comme une charte officielle complète et ses fonctions historiques ne valent pas confirmation des responsabilités actuelles.

## Vérifications des outils

GitHub get_user_login, search_installed_repositories_v2 avec celeste et search_repositories avec user:Steve-Landry-NONO celeste : compte vérifié, aucun dépôt correspondant retourné. Ce résultat ne prouve pas l’inexistence d’un dépôt non autorisé ou nommé autrement. Aucun fichier n’a été poussé vers GitHub dans cette livraison.

## Références techniques officielles consultées

- Supabase Row Level Security : https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage Access Control : https://supabase.com/docs/guides/storage/security/access-control
- Expo Development Overview : https://docs.expo.dev/workflow/overview/
- Expo Build Project : https://docs.expo.dev/deploy/build-project/

Consultation le 2 octobre 2026. Les docs Supabase établissent que grants et politiques contrôlent conjointement l’accès et que les fichiers privés nécessitent des règles de stockage. La doc Expo distingue les builds de développement de la diffusion en stores. Les choix de stack, dates et politiques CELESTE sont nos propositions de conception, pas des conclusions attribuées à ces fournisseurs.

L’accès à l’index changelog Supabase par le navigateur de recherche n’a pas abouti. Il devra être consulté avec les docs pertinentes avant toute implémentation, comme les versions et tarifs actuels. Aucun SDK, migration ni ressource fournisseur n’a été installé ou modifié dans cette livraison.

## Fondations exécutées le 2 octobre 2026

- Documentation Next.js installation et TypeScript, également lue depuis `node_modules/next/dist/docs` de 16.3.8 : https://nextjs.org/docs/app/getting-started/installation et https://nextjs.org/docs/app/api-reference/config/typescript.
- Node TypeScript natif : https://nodejs.org/api/typescript.html. Type stripping distinct du typecheck.
- Versions interrogées dans le registre npm, peerDependencies Next vérifiées, install puis lockfile et build exécutés. Playwright 1.63.0.
- Releases officielles GitHub vérifiées : actions/checkout v7.0.1, actions/setup-node v7.0.0.

Actions/upload-artifact v7.0.1 vérifié sur la release officielle et exécuté avec succès pour la preuve navigateur.

## Auth et organisations implémentées — 2 octobre 2026

Changelog Supabase HTML consulté avant migrations (l’URL .md n’était pas servie) : https://supabase.com/changelog . PostgreSQL 17.11 observé ; les changements ltree, pgcrypto historiques, btree_gist et opérateurs personnalisés ne concernent pas le schéma de cet incrément.

Références officielles consultées pour l’implémentation :
- SSR et cookies : https://supabase.com/docs/guides/auth/server-side/nextjs
- Validation des JWT : https://supabase.com/docs/reference/javascript/auth-getclaims
- Fonctions SQL : https://supabase.com/docs/guides/database/functions
- RLS : https://supabase.com/docs/guides/database/postgres/row-level-security
- Proxy Next.js : https://nextjs.org/docs/app/api-reference/file-conventions/proxy (aussi documentation installée de Next 16.3.8).

Versions interrogées puis installées et verrouillées : @supabase/ssr 0.12.7, @supabase/supabase-js 2.117.2 et CLI 2.119.0. Les tests de base et navigateur portent les preuves d’application, distinctes de ces références.

## Vérification scopes du 3 octobre 2026

Supabase changelog.md consulté; avis PostgreSQL 15.19/17.11 relu : aucun ltree, chiffrement PGP legacy, btree_gist float ou opérateur personnalisé introduit par cet incrément.
- https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes
- https://supabase.com/docs/guides/database/postgres/row-level-security (grants distincts, RLS, tests de refus)
- Documentation Next.js 16.3.8 installée : data-security et server-actions, identité et autorisation côté serveur avant chaque mutation.

## Vérification fichiers privés du 3 octobre 2026

- Supabase Storage Access Control : https://supabase.com/docs/guides/storage/security/access-control
- Buckets privés et URL signées : https://supabase.com/docs/guides/storage/serving/downloads
- Changelog Supabase consulté le 3 octobre 2026 : https://supabase.com/changelog ; l'entrée du 1er octobre n'introduit pas de rupture pertinente pour ce lot.
- Documentation Next.js 16.3.8 installée : Server Actions, `serverActions.bodySizeLimit` et data security. La limite de transport complète les contrôles serveur de type, signature et taille ; elle ne les remplace pas.

Ces sources justifient les mécanismes techniques, pas les droits métier CELESTE. La recette SQL/API vérifie aussi que l'absence de politique Storage interdit l'upload direct aux clients authentifiés.

## Vérification finance du 4 octobre 2026

- Changement Data API Supabase publié le 28 avril et relu le 4 octobre : https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically. Les nouvelles tables publiques exigent des grants explicites, couche distincte de la RLS ; application généralisée annoncée au 30 octobre 2026. La migration CE-004 révoque les droits implicites puis accorde seulement SELECT aux authentifiés et les droits nécessaires au service.
- PostgreSQL 15.19/17.11, avis du 25 septembre relu le 4 octobre : https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes. CE-004 n'utilise ni ltree, ni PGP legacy, ni btree_gist float, ni opérateur personnalisé concerné.
- Guides Next.js et React appliqués : lectures dans le Server Component, mutations par Server Actions réauthentifiées, données sérialisables et aucun composant client asynchrone.

Ces vérifications portent sur la compatibilité technique. Les règles contribution/caisse et les habilitations viennent des décisions CELESTE et restent testées séparément.
