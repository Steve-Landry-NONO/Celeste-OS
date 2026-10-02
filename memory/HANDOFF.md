# Reprise CELESTE OS — 2 octobre 2026

PR #2 ouverte, branche feat/ce-002-foundations, non fusionnée, non déployée. Auth web et création persistée d’organisations sont écrites ; npm run check passe localement (types, 24 tests domaine + 2 configuration, build). La CI complète passe : 26 assertions SQL, 26 tests unitaires, build et huit tests navigateur sans skip. Captures workspace desktop/mobile et accueil mobile inspectées, sans défaut bloquant. Voir reports/2026-10-02_AUTH.md.

## Backend et autorisations
CELESTE OS : vxdneuoglidyngzdfmjc, organisation Steve-Landry-NONO’s Org jmbijvhlwxgoirjffcic, API https://vxdneuoglidyngzdfmjc.supabase.co, Paris eu-west-3, PostgreSQL 17.11. Deux migrations appliquées et alignées sur l’historique distant ; quatre tables publiques avec RLS, aides dans private_celeste. Les 26 assertions SQL ont passé sur le projet distant ; fixtures transactionnelles annulées, zéro compte/organisation/membre après nettoyage.

VAL-001 résolue ; aucun nouveau projet nécessaire. FrequenceGestion pncckdmpmrruhqzpfgdo reste INACTIVE sur instruction de Steve. Ne pas restaurer sans instruction et vérification du quota. FamilyRoot intact ; l’ancien projet vnmlomqxhnjucrrhvkmk n’est plus la cible.

## Reprise exacte
1. Vérifier la tête PR #2 et sa CI. Code vérifié : ac0a15f8c7e7170362580f66b091771195cd1d8a. CI : https://github.com/Steve-Landry-NONO/Celeste-OS/actions/runs/37044433038 ; artifact browser-evidence 11243318853. Les commits documentaires suivants conservent cette référence de code.
2. Lire docs/16_AUTH_SETUP.md et ADR-006. Ne jamais passer une clé administrative au client public. Les paramètres Auth distants et les comptes réels ne sont pas configurés par cet incrément.
3. La recette desktop/mobile est passée et ses captures sont inspectées. Docker absent localement ; la pile CI jetable porte les tests Auth complets. Ne pas attribuer cette preuve au transport email distant : il reste à configurer et tester avant le pilote.
4. Continuer CE-003 : invitations et gestion des membres, scopes projet/mission et fichiers. La fonction manage_membership et ses refus sont testés en base, son interface n’est pas livrée.
5. Continuer CE-004/005 : dépenses et finance atomiques persistées, justificatifs privés, puis tâches réelles et Expo. Aujourd’hui et Lab restent fictifs. Aucun remboursement ni import financier réel.

Les choix métier définitifs restent dans DECISIONS. La création d’un compte ne confère aucun droit sur un espace existant. Ne pas inventer les comptes de Steve, Maeva ou Stéphane.

## Historique
Les rapports BACKEND, SUPABASE_QUOTA et SUPABASE_READY conservent la résolution des accès. Les preuves précédentes de Aujourd’hui sont dans la CI 37033072290 (quatre tests, captures inspectées). L’incrément actuel ajoute Auth à ces tests. Cadence existante : trois reprises par jour autour de 10 h, 14 h et 18 h Europe/Paris jusqu’au 15 octobre.
