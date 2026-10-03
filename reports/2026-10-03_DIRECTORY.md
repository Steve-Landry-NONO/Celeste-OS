# CE-003 — Noms autorisés des membres — 3 octobre 2026

## Résultat concret
Les administrateurs actifs voient les noms des membres de leur espace dans /workspace/members, avec leur référence stable. Les noms sont relus dans profiles, sans copie dans memberships et sans extension de own_profile_read. Fonction privée list_organization_members contrôlée en base par membership.manage ; wrapper public SECURITY INVOKER, search_path vide et grants minimaux. Aucun email, metadata Auth ou profil sans appartenance à cet espace n’est renvoyé. Une suspension ou perte de capacité refuse la lecture suivante. Les noms ressemblant à du HTML restent du texte et les noms de 100 caractères sans espace se replient sur mobile.

## Preuves exécutées et état
Lecture des neuf documents demandés, branches main et feat/ce-002-foundations, PR #2 ouverte et reviews/commentaires relus. CI précédente 37108935114 réussie sur 7ed3ce9ecefdfc20d483f401f38a9d5a561b69bd. Blobs locaux de reprise et fichiers modifiés comparés au SHA distant. Workspace restauré sans .git ; publication via GitHub en conservant l’arbre parent et sans force.

npm run check réussi : types web/domaine, 24 tests domaine, 2 configuration et build. Types de tests/e2e/members.spec.ts vérifiés avec tsc standalone (NodeNext, ES2022). Guides Next locaux autorisation/DTO et Supabase fonctions consultés. Changelog Markdown récupéré via HTTP après rejet content-type par l’outil web ; changement PostgreSQL 17.11 relu, sans ltree, chiffrement legacy ou index btree_gist introduit ici.

La migration et le fichier SQL member_directory.sql sont écrits. Scénarios : annuaire correct, profil extérieur absent, RLS profiles inchangée, organisation nulle/inconnue, autre admin, helper privé, métadonnées éditables, finance/support/vendor, compte suspendu/anonyme/non identifié, rôle anon et changement de nom lu immédiatement. Toutes les fixtures SQL sont transactionnelles et terminent par ROLLBACK. Docker/psql absents localement : aucun succès SQL ou navigateur revendiqué avant CI.

Le parcours navigateur existant est étendu sur desktop/mobile : noms de 100 caractères, schéma de réponse limité, API refusée au membre et à l’autre admin, profil propre seulement, HTML rendu en texte, nom actualisé au rechargement, puis toute la recette rôles/conflits/suspension. Captures à inspecter après CI.

## Validations, risques et prochaine action
VAL-001 déjà résolue ; recherche Gmail sur le sujet précis retourne uniquement le message sortant 1a0fc206ec1ced41, exclu. Les commentaires de l’agent et leur review technique ne prouvent pas une décision humaine. Aucun nouveau choix métier à valider ni email envoyé.

Code écrit et contrôlé localement, CI en attente, migration distante non appliquée, Nouvelle PR annuaire à ouvrir après fusion observée de #2 ; cet incrément n’est ni fusionné ni publié. Invitations, scopes projet/mission et stockage privé restent à construire ; pas de données financières réelles ni de remboursements. Recette du 12 octobre et pilote du 15 conservés, hébergement/confirmation email/onboarding encore ouverts. Vérifier CI et captures avant migration distante ; reprendre ensuite invitations et scopes.
