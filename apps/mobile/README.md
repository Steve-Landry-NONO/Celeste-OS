# Client mobile CELESTE OS

Client Expo SDK 57 pour Android, iOS et web de recette. Le premier parcours persistant couvre la connexion Supabase, le choix d’un espace et la consultation Finance en lecture seule.

```bash
cp .env.example .env.local
npm run start
```

La clé Expo est une clé **publishable** contrôlée par RLS, jamais une clé secrète ou `service_role`. La session native est conservée dans Expo SecureStore et relancée au retour au premier plan. La version pilote n’expose aucune écriture financière ni aucun remboursement.

Contrôles depuis la racine : `npm run check`. L’export Expo produit les bundles Android, iOS et web sans les publier. La recette CI web mobile vérifie le parcours contre une pile Supabase jetable ; elle ne remplace pas encore une installation sur appareil physique.
