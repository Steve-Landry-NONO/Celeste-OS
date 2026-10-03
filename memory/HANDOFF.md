# Reprise invitations — 3 octobre 2026

Steve autorise explicitement la poursuite et la fusion des PR dont le chantier est clos. PR #2 fusionnée et annuaire PR #3 relu ; leur historique reste ci-dessous. Invitations isolées sur feat/ce-003-invitations : cycle complet serveur/base/web, code 256 bits affiché une fois, expiration 7 jours, adresse Auth confirmée, révocation, double acceptation sérialisée, rôle existant préservé et suspension non contournable.

Migration 20261003082235 appliquée au seul backend CELESTE OS ; tests SQL distants passés avec ROLLBACK. npm run check passe. Douze parcours desktop/mobile à vérifier en CI, puis captures sans code et merge si vert. Pas de mail automatique, compte réel ou déploiement. Les droits projet/mission restent la prochaine tranche avant fichiers/finance. Voir reports/2026-10-03_INVITATIONS.md et ADR-008.

# Reprise annuaire — 3 octobre 2026

PR #2 observée fusionnée à 08:18:37Z, merge bb7f3a11e6c64acdc2d3548d2c96481727be1bc6. PR #3 ouverte, branche feat/ce-003-member-directory. Code annuaire 61da0272cf62ea8ef0b559f3d75a9fccb8f6cc1d : CI 37109445474 réussie, 26 assertions Auth SQL et scénarios annuaire, types, 24 tests domaine + 2 configuration, build, dix parcours navigateur sans skip. Artifact 11268929223 ; captures noms longs desktop/mobile et cartes finales mobile inspectées sans défaut bloquant.

Annuaire réservé aux admins actifs de l’espace ; noms relus depuis profiles sans élargir own_profile_read, projection limitée sans contact. Migration déjà présente sur le projet dédié, version 20261003082224, définition identique vérifiée et EXECUTE anon refusé. Ne pas la réappliquer. Scénarios annuaire exécutés à distance avec ROLLBACK ; zéro organisation/membre/profil ensuite. Le fichier versionné est renommé pour correspondre à l’historique distant ; vérifier la CI de cette tête d’alignement avant fusion. Le code annuaire n’est ni fusionné ni déployé.

Travail concurrent observé et préservé : migration organization_invitations appliquée à distance en 20261003082235 ; fichiers locaux d’invitations et modifications page/types apparus après le gel du commit annuaire. Ils ne sont pas inclus dans cette PR ni validés par sa CI. Ne pas les écraser, ne pas créer un deuxième parcours d’invitations ; reprendre et réconcilier les fichiers/migration sur la branche active après lecture des nouvelles PR et de main. Le workspace local courant ne correspond donc plus entièrement au commit annuaire testé. Les preuves concernent le SHA gelé, jamais ces éditions supplémentaires. Aucun reset distant.

Prochaine action exacte : vérifier la tête de PR #3, puis reprendre les invitations en cours et leurs tests, scopes projet/mission, fichiers privés. Hébergement, confirmation email et onboarding réel restent à préparer. Recette 12 octobre et pilote 15 maintenus, sans nouveau blocage durable établi. VAL-001 résolue ; mail sortant enregistré exclu, pas de nouveau retour humain explicite ni email envoyé. Voir reports/2026-10-03_DIRECTORY.md. Les sections suivantes sont historiques et leurs statuts antérieurs ne remplacent pas ce bloc.

# Reprise CELESTE OS — 3 octobre 2026

PR #2 conservée, branche feat/ce-002-foundations. Base distante 639ad59906985b690a832701061f99ab841d527d : CI finale réussie, huit tests navigateur sans skip. Aucun autre incrément actif observé. Aucune nouvelle réponse humaine GitHub ; Gmail VAL-001 ne retourne que le mail sortant déjà enregistré, exclu.

CE-003 : interface /workspace/members pour rôles et suspension des appartenances existantes, contrôles serveur et RPC atomique existante, dernier administrateur et conflit de version. npm run check passe localement : types, 24 tests domaine, 2 configuration et build. Les dix tests Playwright passent sans skip sur 0a23faf027302e7443dd2da1b86867c209455e0f ; CI 37108614505, artifact 11269081011. Captures membres desktop/mobile inspectées, aucun défaut bloquant. Docker absent localement. Aucune migration ni configuration distante modifiée.

Reprise : vérifier les checks de la tête documentaire puis poursuivre invitations et scopes. La recette des membres est archivée dans reports/2026-10-03_MEMBERS.md. Les comptes sont identifiés par UUID ; invitations et noms autorisés restent à construire, sans exposer les emails ou modifier la politique RLS des profils. Scopes projet/mission et fichiers privés restent requis avant finance et tâches persistées. Aucun compte réel ajouté. Pilote du 15 octobre et recette du 12 conservés ; aucune dépendance nouvelle n’impose un report constaté à ce stade.

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
