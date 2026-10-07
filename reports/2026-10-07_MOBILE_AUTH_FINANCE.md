# Rapport CE-008 — Auth et Finance mobile

Date : 7 octobre 2026  
Branche : `feat/ce-008-mobile-auth-finance`  
PR : à ouvrir

## Résultat

Le placeholder mobile est remplacé par une application Expo SDK 57. Elle gère la connexion email/mot de passe, la reprise de session, la sélection d’une organisation active et une vue Finance en lecture seule. Les totaux et contributions viennent des RPC persistées existantes ; les remboursements restent visibles comme régime désactivé, sans commande de demande, activation ou paiement.

La configuration refuse les clés serveur. La session utilise SecureStore sur iOS/Android et AsyncStorage pour la recette web. Les rôles sans `finance.read` ne voient pas l’action ; le contrôle serveur reste la source d’autorité. Aucune règle de caisse, contribution, document ou périmètre n’est modifiée.

## Contrôles exécutés

`npm ci` passe avec un graphe React 19.2.3 cohérent pour Next et Expo. `npm run typecheck --workspace=@celeste/mobile` et `npm test --workspace=@celeste/mobile` passent : 5 tests, 0 échec. `npm run export --workspace=@celeste/mobile` produit les bundles web, Android et iOS. `npx playwright test --list` découvre 22 entrées ; le scénario Expo est volontairement exécuté une seule fois sur le projet `mobile-web`, soit 21 parcours attendus en CI.

Le parcours interactif Expo/Supabase, les security advisors et les suites SQL ne sont pas exécutables localement sans pile Docker ; ils attendent la CI. L’export natif n’est pas une recette sur appareil physique. Aucun résultat CI ou appareil non exécuté n’est présenté comme réussi.

## Provenance et dépendances

Avant développement, aucune PR CE-008 ni branche concurrente n’était ouverte. VAL-002 reste ouverte sans commentaire humain. Le profil Gmail connecté a été vérifié comme `stevelandryk89@gmail.com` ; la recherche exacte de VAL-002 ne retourne aucune réponse. Les message IDs déjà classés `email_sent`, commentaires agent et textes cités ont été exclus. Aucun nouvel email ni relance.

Le projet Supabase CELESTE OS `vxdneuoglidyngzdfmjc` reste INACTIVE. `familyroots-mvp` et `FamilyROOT Test` restent actifs et inchangés ; FrequenceGestion reste INACTIVE. Aucune restauration, pause, migration distante, publication ou donnée réelle n’a été effectuée.

## Calendrier et risques

La baseline initiale reste recette anticipée le 12 octobre et pilote le 15 à titre historique. La limite du 7 octobre à midi est dépassée : si le backend est réactivé au plus tard le 8 octobre à midi, la prévision devient recette utilisateurs le 17 octobre et pilote le 20 ; ensuite, ajouter au moins un jour aux deux dates par jour de blocage. La recette technique jetable reste visée le 12.

Risques restants : CI complète de la branche, revue sur appareil physique, restauration et revalidation distante des migrations, configuration Auth/email, onboarding et déploiement. CE-008 ne nécessite aucune nouvelle décision métier et ne déclenche donc aucune demande de validation ni email.
