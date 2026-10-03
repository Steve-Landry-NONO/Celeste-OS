# Auth et isolation des organisations
ID ADR-006 · 2 octobre 2026 · Choix technique implémenté, revue produit ouverte

REQ-01, AUTH-01, ACL-01 et ACL-03 exigent des droits contrôlés côté serveur et base. Supabase Auth porte l’identité ; memberships porte les rôles et statuts, évalués en base à chaque opération. Les métadonnées utilisateur servent uniquement au nom affiché, jamais à accorder un rôle. Un compte suspendu perd son accès sans attendre le renouvellement du JWT.

Toutes les tables publiques ont RLS. Les fonctions privilégiées restent dans private_celeste, hors schémas API, avec search_path vide, identité vérifiée et refus des comptes anonymes. Les wrappers RPC publics sont INVOKER et réservés à authenticated. Les privilèges par défaut de Supabase sont révoqués avant les GRANT ciblés.

La création d’un espace crée atomiquement l’organisation, son administrateur et l’événement d’audit. Un utilisateur inscrit peut administrer son propre nouvel espace ; il n’obtient aucun accès à une organisation existante. Aucun compte fondateur réel ni organisation métier CELESTE n’a été créé automatiquement.

Les modifications de membres passent par une transaction qui verrouille l’organisation, vérifie le droit membership.manage et la version attendue, interdit la suppression du dernier administrateur actif et écrit l’audit. Aucun INSERT/UPDATE direct sur memberships n’est accordé au client. L’interface de gestion des membres reste à construire.

Les alternatives étaient des rôles dans user_metadata, des vérifications exclusivement côté UI ou des fonctions privilégiées directement exposées. Elles rendent l’autorisation modifiable ou plus difficile à contrôler. Les aides privées centralisent les contrôles et évitent la récursion des policies.

Les sessions web utilisent SSR et cookies HttpOnly, Secure en production, SameSite=Lax ; les pages personnelles sont sans cache partagé. Le serveur valide l’utilisateur avec getUser ; les données sont lues avec sa session et RLS. La clé service_role/secret n’entre jamais dans le client web. La CI utilise une clé administrative uniquement sur son Supabase local jetable.

Limites : scopes projet/mission, fichiers privés, opérations financières, invitations, UI d’administration, MFA et application native restent à réaliser. Les permissions financières sont un contrat préparatoire sans endpoint financier. Cette ADR n’active aucun remboursement et ne décide pas des approbateurs métier définitifs.
