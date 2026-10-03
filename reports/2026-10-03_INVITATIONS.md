# CE-003 — Invitations — 3 octobre 2026

## Résultat

Création, révocation et acceptation persistées d’invitations de 7 jours pour une adresse et un rôle précis. Code affiché une seule fois, empreinte privée, identité vérifiée côté Auth, appartenance atomique et audit. Un rôle existant n’est pas modifié par l’invitation ; un membre suspendu ne peut se réactiver. Aucun envoi automatique ni compte réel créé.

## État vérifié avant publication

PR #2 fusionnée sur autorisation explicite de Steve : bb7f3a11e6c64acdc2d3548d2c96481727be1bc6, CI de tête réussie 37108935114 et aucun thread ouvert. Un cycle programmé concurrent a ouvert PR #3 (annuaire). Sa CI 37109445474 passe ; captures desktop/mobile inspectées ici, sans défaut bloquant. Correction documentaire et alignement de migration sur 37becc5, CI finale encore en cours au moment de cette écriture. Les éditions concurrentes ont été relues depuis leur SHA et conservées ; invitations séparées dans leur propre branche.

Sur le projet dédié vxdneuoglidyngzdfmjc : migrations additives admin_member_directory et organization_invitations appliquées, versions distantes 20261003082224 et 20261003082235 reprises dans les noms des fichiers. Tests invitations transactionnels passés avec ROLLBACK. Advisors sécurité sans WARN/ERROR : INFO attendues sur les deux tables privées sans politique client ; performance sans avis. Aucun autre backend modifié.

`npm run check` réussi : types, 24 tests domaine, 2 tests configuration et build de douze routes. Types de la nouvelle recette Playwright vérifiés (tsc standalone ES2022/NodeNext). Douze tests navigateur listés ; exécution interactive attend la CI locale jetable, Docker/psql non disponibles ici. Les scénarios SQL distants ne remplacent pas cette recette web.

## Recette attendue

Toutes migrations rejouées en CI, suites SQL Auth/annuaire/invitations, types/tests/build, douze tests navigateur sans skip. Nouveaux parcours : code unique, mauvaise adresse, liste privée, doublon, révocation, champ organisation falsifié, acceptation/persistance, rôle prestataire, noms live, absence de code dans l’historique, deux acceptations simultanées dont une seule réussit. Captures sans code d’invitation à inspecter.

## Limites et reprise

Scopes projet/mission, fichiers privés, finance persistée, Expo, hébergement, confirmation et transport email distants restent à livrer. Remboursements désactivés. Recette du 12 octobre et pilote du 15 maintenus comme cibles ; aucun déploiement web réalisé. Vérifier et corriger la CI, inspecter les captures, archiver le SHA vérifié puis fusionner si le chantier est clos conformément à la demande de Steve.

PR #3 fusionnée après CI finale réussie 37109944934 et thread documentaire résolu : merge 710c6d784d994dc3f304679a7fd0cc1e723870b2. Le lot invitations part de ce merge et conserve tout son arbre distant.
