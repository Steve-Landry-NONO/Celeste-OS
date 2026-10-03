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

## Registre des commandes vérifiées — 2 octobre 2026

| Action | Commande | État |
|---|---|---|
| Installation npm | `npm install --no-fund --no-audit` puis `npm ci` | Lockfile produit ; contrôle propre dans le rapport de cycle |
| Web local | `npm run dev` | Serveur Next.js sur 127.0.0.1:3000 |
| Types | `npm run typecheck` | Next typegen + tsc pour web, tsc pour domaine |
| Domaine | `npm test` | 24 scénarios domaine + 2 contrôles configuration web |
| Build web | `npm run build` | Routes démo et Auth ; workspace dynamique |
| Chaîne locale | `npm run check` | Types → 26 tests unitaires → build |
| Mobile Expo | À renseigner après initialisation | Non exécuté |
| Auth/API/RLS | Supabase migrations et tests SQL versionnés | 26 assertions distantes passées, fixtures annulées ; recette Auth navigateur en CI |

Versions fixées : Next.js 16.3.8, React 19.3.0, TypeScript 5.9.3. Node 24.19.0 exécute les tests `.mjs` qui importent le domaine `.ts` avec type stripping. Ce mécanisme ne vérifie pas les types ; le contrôle tsc séparé reste obligatoire. Utiliser le lockfile, ne pas installer `latest` à chaque cycle.

La CI démarre une pile Supabase locale jetable, rejoue les migrations et teste RLS. Elle n’effectue pas encore de lint, build Expo, scan de secrets ou audit de dépendances. Ces contrôles doivent être ajoutés avec leurs outils configurés, sans les annoncer comme existants. La couche serveur doit fournir transactions, permissions et journal durable avant toute utilisation financière réelle.

Voir [Auth Setup](16_AUTH_SETUP.md) pour les variables, la clé publiable, la confirmation et les tests Auth. La pile CI reçoit un identifiant et des ports libres propres à chaque exécution ; aucun reset de base distante.
