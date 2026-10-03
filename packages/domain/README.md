# Domaine financier partagé

Moteur TypeScript pur du pilote EUR, réutilisable par Next.js et le futur client Expo. Montants en centimes entiers sûrs ; `parseEuros` convertit une chaîne décimale sans calcul flottant. Les noms A/B/C n’appartiennent qu’aux tests et au simulateur.

## Contrat

- `createLedger(organizationId, founderIds)` ouvre un journal vide, sans solde initial inventé.
- `record(ledger, command)` retourne un nouveau journal figé. Seules les opérations confirmées entrent dans ce journal : dépense personnelle en contribution, versement au fonds, dépense du fonds et remboursement fournisseur lié. Un engagement non payé doit vivre dans un modèle séparé.
- Même clé et même payload : résultat inchangé. Payload différent : `IDEMPOTENCY_CONFLICT`. Ordre des champs indifférent ; champs inconnus refusés.
- `totals(ledger)` distingue coût net, trésorerie, contributions et reste à apporter. Les parts juridiques restent hors de ce calcul.
- `formatEuros(cents)` affiche les centimes entiers sûrs en français, sans division flottante, y compris zéro, les valeurs négatives et la limite de `Number.MAX_SAFE_INTEGER`. Une valeur fractionnaire ou hors limite est refusée plutôt qu’arrondie. Le dernier centime accepté par `parseEuros` doit être conservé dans les totaux, les contributions et le journal.
- Un remboursement fournisseur vers le fonds sur une dépense personnelle conserve la contribution économique initiale. Son effet est la réduction du coût et l’augmentation de caisse. La future couche serveur devra journaliser les liens d’annulation de contribution et de versement associés.
- Le régime d’avances remboursables n’est pas implémenté ni activable. Les commandes de remboursement de fondateur sont refusées. Aucun seuil de réserve n’est inventé.

## Limites à conserver lors de l’intégration

Ce package accepte uniquement les journaux produits par ses fonctions. Il ne valide pas un journal arbitraire désérialisé. Le serveur devra construire ce contexte depuis des données autorisées et validées.

Les refus d’organisation dans le moteur constituent un contrôle de cohérence, pas une preuve d’isolation RLS. L’idempotence en mémoire ne garantit pas une transaction SQL ou la concurrence : imposer une contrainte unique par organisation/clé et une transaction atomique côté serveur. Conserver acteur, horodatage, pièce et références dans le journal durable. Ne jamais calculer les soldes financiers fiables exclusivement dans le navigateur.

`npm test` à la racine exécute les tests Node 24 (type stripping natif). `npm run typecheck` vérifie réellement les types avec TypeScript. Tests d’accès API, RLS, fichiers, concurrence SQL et restauration : non disponibles avant backend dédié (VAL-001).
