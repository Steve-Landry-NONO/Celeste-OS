# Historique de CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Dossier initial du 2 octobre 2026

Version documentaire 0.1.0. Cadrage, CDC, spécifications, finance, documents versionnés, UX, architecture, données, permissions, roadmap, recette, intégrations, exploitation, initialisation, gouvernance et mémoire. Deux sprints et backlog initial.

Cette version est un lot documentaire proposé pour revue. Elle ne désigne pas une version applicative CELESTE OS déjà publiée.

## Incrément 0.1.1 — non publié

Fondations web Next.js, domaine financier TypeScript partagé et tests. Simulation isolée et liens vers les documents GitHub. CI types/domaine/build et recette navigateur configurée. Validation VAL-001 et email tracés. Aucun parcours financier réel, Auth, client Expo ou déploiement encore livré.

Correction de revue du 2 octobre : affichage EUR exact jusqu’au dernier centime accepté, formateur partagé et quatre tests de régression supplémentaires (18 tests domaine). Recette navigateur étendue aux grands montants et au refus sans écriture d’un dépassement de capacité. L’état d’exécution distant est consigné dans la PR #2 et le rapport de précision.

Contrat « Aujourd’hui » ajouté dans le même incrément : tâche à responsable unique, motif obligatoire si bloquée, dates civiles contrôlées, tri déterministe, progression calculée et filtrage cohérent par organisation, projet et mission. Nouvelle route `/today` explicitement fictive et mobile-first. Six tests portent le domaine à 24 ; la persistance et les contrôles serveur restent bloqués par VAL-001.

## Incrément Auth/organisations — non publié

Connexion, inscription, confirmation et déconnexion web ; organisations persistées et espace personnel. Deux migrations Supabase appliquées, RLS et RPC atomiques, 26 assertions SQL passées. CI étendue à la pile Supabase locale jetable et aux parcours Auth desktop/mobile. Deux tests de garde des clés et URL portent les tests unitaires à 26. Invitations, scopes mission/projet, fichiers et finance persistée restent à livrer ; voir rapport AUTH.

## Incrément membres — 3 octobre 2026, non publié

Administration web des appartenances existantes : rôle, suspension et réactivation. Refus serveur/base, dernier administrateur, version attendue et audit atomique. Dix tests navigateur desktop/mobile sans skip, 26 assertions SQL et 26 tests unitaires passent. Invitations et scopes projet/mission restent à réaliser ; aucune release publiée.

## Annuaire administratif — 3 octobre 2026, non publié

Noms des membres affichés dans leur espace aux administrateurs actifs, sans élargir la lecture des profils et sans contact exposé. Refus SQL en base/CI, rendu texte des noms et retour à la ligne sur mobile vérifiés. Dix parcours navigateur sans skip, 26 tests unitaires et build passent sur 61da027 ; preuves dans le rapport DIRECTORY. Fonction distante déjà appliquée, migration versionnée alignée ; PR #3 non fusionnée et non déployée.

## Invitations — 3 octobre 2026, non publié

Invitations d’organisation persistées, expiration 7 jours, code unique à empreinte privée, révocation et acceptation atomiques. Administration/historique et parcours Rejoindre un espace. Adresse Auth confirmée, rôle existant préservé et refus des comptes suspendus. Tests SQL/API/web desktop/mobile ajoutés ; preuve courante dans rapport INVITATIONS.
