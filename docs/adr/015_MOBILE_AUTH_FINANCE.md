# ADR-015 — Auth et Finance mobile en lecture

Date : 7 octobre 2026  
Statut : accepté pour CE-008  
Décisions liées : ADR-006, ADR-011, ADR-012, ADR-013, MOB-01

## Contexte

Le web possède déjà l’authentification, les organisations et les agrégats financiers persistés. CE-008 doit fournir un premier parcours Expo utile sans dupliquer les règles financières ni introduire une autorisation seulement visuelle. Le backend distant est en pause ; la preuve reproductible doit donc utiliser la pile Supabase jetable de CI.

## Décision

L’application Expo partage les contrats de domaine mais pas les composants DOM. Elle accepte seulement l’URL Supabase et une clé publishable via les variables publiques Expo ; une clé `service_role` ou `sb_secret_` fait échouer la configuration. La session est persistée dans SecureStore sur iOS/Android, découpée en fragments bornés, et dans AsyncStorage sur le web de recette. Le rafraîchissement automatique suit l’état actif de l’application.

Le client charge uniquement les appartenances actives visibles par RLS. Finance est exposée en lecture aux rôles habilités et relit trois RPC existantes en parallèle : totaux, contributions et politique de remboursement. Aucun calcul financier alternatif, aucune écriture, aucun versement, aucune dépense et aucun remboursement n’est ajouté au mobile. La politique doit être explicitement `disabled`, sinon l’écran échoue fermé. Les membres non habilités ne voient pas l’action Finance ; le refus `42501` reste vérifié directement contre la base.

La CI exporte les bundles web, Android et iOS et exécute le parcours Expo web sur un viewport téléphone contre Supabase jetable : connexion, organisation, finance à zéro, verrou de remboursement, persistance après rechargement, déconnexion et refus d’un membre.

## Conséquences

Le même modèle RLS/RPC protège Next et Expo, sans clé serveur embarquée et sans double comptage de caisse. La session native n’est pas stockée en clair. Les documents publiés et leurs règles d’immutabilité ne sont pas touchés.

L’export natif prouve que les bundles sont générables, mais ne remplace pas une vérification sur téléphone physique, notamment clavier, cycle réseau et retour d’arrière-plan. MOB-01 reste donc partiellement ouvert jusqu’à cette recette appareil. Aucun backend, compte réel, migration ou déploiement distant n’est créé par CE-008.
