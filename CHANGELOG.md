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

Invitations fusionnées en PR #4, code 2582521f2d435e910a790ef0219e5ae78e357c33, CI 37110737675 verte : douze parcours et trois suites SQL. Backend en pause et rétablissement bloqué par quota, demande VAL-002 ouverte ; aucune publication web.

## CE-003 scopes — fusionné le 3 octobre 2026

Création projets/missions et lecture explicite, accord/révocation avec version et audit du membre visé. Accords inactifs après suspension ou déclassement distingués à l’écran. PR #6 fusionnée après quatre suites SQL, security advisors, 26 tests unitaires, build et 14 parcours desktop/mobile sans skip; captures inspectées. Migration distante en attente, aucun déploiement. Fichiers et droits d’écriture métier restent à livrer.

## CE-003 fichiers privés — fusionné le 3 octobre 2026

Bucket privé, métadonnées projet/mission, dépôt serveur contrôlé jusqu'aux octets, SHA-256 et lien signé court. Accord de dépôt distinct, prestataire limité aux missions, objets prêts immuables côté client. La revue a conduit à supprimer l'upload/finalize direct et à sérialiser la finalisation avec les révocations. PR #7 fusionnée après cinq suites SQL, security advisors, 27 tests unitaires/configuration, build et seize parcours navigateur sans skip sur pile jetable ; aucune migration distante ni publication web.

## CE-004 dépenses personnelles — fusionné le 4 octobre 2026

Catégories dynamiques, dépense personnelle EUR confirmée, justificatif privé du même périmètre et contribution dérivée unique sans caisse. Historique conservé après suspension du payeur et date civile de l’organisation. PR #8 fusionnée après six suites SQL, security advisors, 27 tests domaine/configuration, build et 18 parcours navigateur sans skip ; captures desktop/mobile inspectées. Caisse, versements et remboursements restent désactivés. Aucune migration distante ni publication.

## CE-005 caisse et égalisation — fusionné le 5 octobre 2026

Caisses EUR à solde initial nul, versements, dépenses du fonds et avoirs fournisseur atomiques. Coût net, caisse, contributions, référence et reste à apporter sont dérivés sans double comptage. Les écritures confirmées sont immuables ; une garde transactionnelle refuse aussi tout agrégat d’organisation hors de la plage entière sûre. Les remboursements de personnes restent désactivés. PR #9 vérifiée sur pile jetable : sept suites SQL, security advisors, 27 tests domaine/configuration, build et 18 parcours navigateur sans skip ; captures desktop/mobile inspectées. Aucune migration distante ni publication.


## CE-006 verrou des remboursements — fusionné le 5 octobre 2026

Politique versionnée provisionnée par organisation, strictement `disabled`, sans réserve ni approbateur, immuable et isolée par RLS. Lecture Finance persistée, sans bouton ni commande de demande, activation ou paiement. Suite SQL FIN-05 dédiée et contrôle navigateur ajoutés ; tête de code vérifiée par CI 37310891629 avec huit suites SQL, advisors, build et 18 parcours sans skip. PR #10 fusionnée en `8d803dfe6858ae05dfd3468edfb277ce0699e9c6`. Aucune migration distante ni publication.

## CE-007 phases, tâches et Aujourd’hui — fusionné le 7 octobre 2026

Phases liées aux projets, tâches à responsable unique, motif de blocage, historique append-only et concurrence optimiste. La lecture suit strictement les périmètres projet/mission ; `task_write` est distinct de la lecture et des fichiers, et `task.assign` reste nécessaire pour attribuer à autrui. `/workspace/tasks` calcule Aujourd’hui et la progression depuis les mêmes tâches lisibles. PR #11 fusionnée en `3659f8df28bafe4936d3a36e601dca75e13adf05` après CI finale verte ; aucune migration distante ni publication.

## CE-008 Auth et Finance mobile — en revue le 7 octobre 2026

Application Expo SDK 57 avec connexion, session SecureStore native, sélection d’organisation et Finance en lecture via les RPC existantes. Les rôles non habilités ne voient pas l’action et le refus base reste couvert ; aucune écriture financière ni commande de remboursement. Six tests mobiles et les exports web/Android/iOS passent localement. Parcours Expo/Supabase de CI et recette sur appareil physique encore à confirmer ; aucune publication.
