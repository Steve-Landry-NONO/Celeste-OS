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
