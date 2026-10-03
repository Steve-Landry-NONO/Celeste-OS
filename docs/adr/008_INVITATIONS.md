# ADR-008 — Invitations d’organisation

3 octobre 2026 · Implémentée dans CE-003 · Choix technique

## Décision

L’administrateur crée une invitation pour une adresse et un rôle précis. Le code aléatoire de 256 bits est affiché une seule fois après création. La base privée conserve son empreinte SHA-256, jamais le code. Il expire après 7 jours. Le destinataire le saisit dans `/join` après inscription ou connexion avec l’adresse invitée confirmée. Le code n’est placé ni dans l’URL ni dans les événements d’activité. L’application n’envoie pas encore d’email d’invitation ; l’administrateur transmet le code lui-même.

L’acceptation lit l’adresse confirmée dans `auth.users`, indépendamment des champs du formulaire et des métadonnées modifiables. Création, acceptation et révocation verrouillent l’organisation dans le même ordre que l’administration des membres. Appartenance et consommation sont atomiques ; deux appels simultanés ne peuvent réussir tous les deux. Les refus n’ajoutent ni membre ni événement d’activité. Le créateur doit encore être administrateur actif au moment de l’acceptation.

Une appartenance active existante conserve son rôle et son identité. Une appartenance suspendue reste suspendue et ne peut accepter l’invitation. Toute élévation ou réactivation passe par l’administration des membres. Une invitation en attente par adresse et organisation ; après expiration ou révocation, une nouvelle invitation peut être créée. Cent invitations non expirées en attente maximum par organisation.

## Accès et limites

Table privée avec RLS et sans accès client. RPC publiques SECURITY INVOKER ; fonctions privilégiées dans `private_celeste`, search_path vide, contrôles d’identité/capacité et EXECUTE refusé à PUBLIC/anon. Historique (adresse, rôle, dates, statut) réservé aux administrateurs actifs ; ni code ni empreinte n’est retourné par la liste. Les noms des membres restent servis par ADR-007.

Ce lot attribue un rôle d’organisation. Il ne crée aucun droit à un projet ou une mission ; ces périmètres restent à implémenter avant leurs contenus persistés. La confirmation email et le transport distant seront vérifiés au déploiement. Aucun compte réel n’est invité pendant la recette.

## Alternatives

Invitation Auth administrative : écartée pour ce lot, elle demanderait un secret serveur et couplerait l’appartenance à la création d’identité. Code dans une URL : évité pour limiter sa présence dans les logs et historiques. Email automatique : différé jusqu’au transport configuré et à la validation du flux.

## Preuves

`supabase/tests/invitations.sql` : lifecycle, email vérifié, refus interorganisation, rôles, accès privé, replay, expiration, révocation, suspendu et créateur déclassé, fixtures annulées. `tests/e2e/invitations.spec.ts` : parcours web/mobile et appels API concurrents sur pile jetable. État et résultats effectifs dans `reports/2026-10-03_INVITATIONS.md`.
