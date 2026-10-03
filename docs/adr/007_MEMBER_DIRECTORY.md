# ADR-007 — Noms dans l’administration des membres

3 octobre 2026 · Implémenté techniquement, sans validation métier implicite · CE-003 / REQ-01

Besoin : permettre à un administrateur de reconnaître les comptes dont il gère le rôle ou la suspension, sans ouvrir la lecture des profils à tous les membres et prestataires.

Choix : fonction privée list_organization_members avec contrôle membership.manage lié à auth.uid() et à l’organisation demandée. Wrapper public SECURITY INVOKER, search_path vide, EXECUTE refusé à PUBLIC/anon. Résultat explicite : appartenance, rôle, état, version, dates et nom affiché ; aucun contact ou metadata Auth. Les accès suspendus restent identifiables pour l’administrateur qui peut les réactiver. Les noms restent lus depuis profiles et rendus comme texte ; référence stable conservée.

Alternative écartée : élargir own_profile_read à toute organisation partagée. Cela divulguerait des profils aux prestataires et aux futurs utilisateurs limités à une mission. Pas de cache de noms dans memberships, pour éviter des copies périmées.

Preuve : CI 37109445474 sur 61da027, refus API/base et noms longs/HTML vérifiés, SQL distant avec ROLLBACK réussi. Migration distante observée identique en 20261003082224 ; fichier aligné sans réapplication. Invitations et scopes restent des incréments distincts.
