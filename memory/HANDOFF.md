# Reprise CELESTE OS — 2 octobre 2026

## État courant

PR #2 ouverte, branche `feat/ce-002-foundations`, non fusionnée. Le socle web, le domaine financier et le scénario « Aujourd’hui » sont écrits et testés. Auth, persistance métier, RLS, Expo et déploiement restent à implémenter.

Le backend dédié **CELESTE OS** est créé et vérifié :
- organisation : `Steve-Landry-NONO’s Org`, `jmbijvhlwxgoirjffcic` ;
- projet : `vxdneuoglidyngzdfmjc` ;
- URL API : https://vxdneuoglidyngzdfmjc.supabase.co ;
- région : Paris, `eu-west-3` ;
- état observé : `ACTIVE_HEALTHY` ;
- accès SQL vérifié : `select 1` renvoie 1 ; PostgreSQL 17.11 ;
- aucune table public, aucune migration appliquée à cette étape.

Steve a approuvé la création dans cette organisation après annonce de coût 0/mois. VAL-001 est résolue. Ne pas redemander son choix ni créer un autre projet. L’ancien projet `vnmlomqxhnjucrrhvkmk` n’est plus la cible ; il reste inaccessible au compte actuel.

## FrequenceGestion en pause

Steve a explicitement autorisé la pause de FrequenceGestion pour libérer le quota gratuit. Projet `pncckdmpmrruhqzpfgdo` vérifié `INACTIVE` après `pause_project`. Ne pas le restaurer ou modifier ses données sans nouvelle instruction ; son backend est indisponible pendant cette pause. FamilyRoot n’a pas été modifié.

## Prochain incrément

1. Vérifier la tête et la CI de PR #2, puis lire les specs données/permissions et les instructions proches des fichiers.
2. Utiliser le connecteur Supabase sur **vxdneuoglidyngzdfmjc**. Vérifier les tables et migrations à nouveau si une autre session a avancé.
3. Versionner les migrations CE-002/CE-003 et implémenter Auth, organisations, profils et membres. Contrôler les droits en base ; tester au moins deux organisations et les refus d’accès interorganisation. Une base accessible ne prouve pas une application connectée.
4. Récupérer la clé publiable au moment de configurer le client ; ne jamais exposer service_role/secret dans Next public ou mobile. Aucun secret n’est inclus dans ce dossier.
5. Brancher la connexion web et vérifier le parcours. Continuer ensuite la finance atomique et les justificatifs privés selon les specs.

## Preuves applicatives antérieures

Le commit de code `d78f81745060624c9bcbf6a5b39163cdb59647e5` passe installation, types, 24 tests domaine, build et quatre parcours Playwright desktop/mobile dans https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/37033072290 . Artifact browser-evidence 11237758163 inspecté pour Aujourd’hui desktop/mobile. La tête documentaire `fa77968c1eb2c37048baa137d71dc3ab0b516b14` passe la CI 37033487921. Les ajouts documentaires ultérieurs peuvent relancer la CI ; vérifier la nouvelle tête avant fusion.

Le navigateur local était bloqué avant interaction ; ce résultat reste distinct de la recette CI. Les scénarios web demeurent fictifs et non persistants. Aucune preuve RLS, de build Expo ou de déploiement n’existe à cette étape.

## Historique et cadence

Les erreurs de connexion, le quota puis sa résolution sont conservés dans les rapports BACKEND, SUPABASE_QUOTA et [SUPABASE_READY](../reports/2026-10-02_SUPABASE_READY.md), ainsi que validations/events.jsonl et l’issue #1. Le recours au navigateur est déjà autorisé, mais le connecteur fonctionnel reste prioritaire.

Trois reprises quotidiennes autour de 10 h, 14 h et 18 h Europe/Paris, jusqu’au 15 octobre. Baseline : première recette anticipée le 12, pilote le 15. Déblocage backend le 2 octobre ; livrer maintenant les parcours persistés. Aucune donnée financière réelle importée ; remboursements toujours désactivés.
