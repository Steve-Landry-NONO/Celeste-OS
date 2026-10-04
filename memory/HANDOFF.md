# État prioritaire — dépenses personnelles en CI, 4 octobre 2026

Branche `feat/ce-004-expenses` créée depuis main documentaire `2b4e8868`. Catégories, dépense personnelle EUR confirmée, justificatif privé obligatoire du même périmètre et contribution dérivée unique sont écrits. RLS, grants explicites, idempotence payload, immutabilité et refus caisse/remboursement sont dans la migration `20261004081254_personal_expenses`. Route `/workspace/finance`, scénario SQL et parcours navigateur ajoutés. `npm run check` passe localement : types, 24 domaine, 3 configuration et build. Docker/PostgreSQL/Chromium absents localement ; ne pas annoncer SQL ou navigateur avant la CI.

Backend CELESTE OS vérifié INACTIVE le 4 octobre ; VAL-002 reste sans commentaire. Gmail ne contient que le message sortant VAL-001 `1a0fc206ec1ced41`, explicitement exclu. Aucun nouveau mail, aucune relance, aucune migration distante. Publier la branche, attendre les six suites SQL, advisors et 18 parcours attendus desktop/mobile, inspecter les captures, traiter toute revue puis actualiser PR, rapport et mémoire.

Calendrier : baseline 12 recette/15 pilote conservée comme référence initiale mais plus comme prévision distante. Prévision conditionnelle 14 recette utilisateurs/17 pilote si réactivation au plus tard le 5 à midi ; au-delà, décaler d'au moins un jour par jour de blocage. Voir ADR-011 et rapport `reports/2026-10-04_EXPENSES.md`.

## Historique immédiatement précédent

# État prioritaire — fichiers privés fusionnés, 3 octobre 2026

PR #7 fusionnée : tête vérifiée `3e9473d2de54602d590f9e0aabf7d14fdb21c8d9`, merge `45a701b919c77c5e434279a8f362c76cbc65943e`. Dépôt serveur de fichiers privés projet/mission, inspection des octets, SHA-256, capacité de dépôt distincte, objets prêts immuables et téléchargement signé 60 secondes. Aucun upload ou finalize direct depuis un client authentifié. Finalisation et révocation utilisent le même verrou d'organisation. ADR-010 et rapport PRIVATE_FILES.

CI finale 37137848450 : six migrations, cinq suites SQL avec rollback, security advisors sans alerte, types, 24 domaine + 3 configuration, build, 16 parcours desktop/mobile sans skip. Artifact 11278987341; captures lecture seule desktop/mobile inspectées. Les CI 37136937459 et 37137556225 ont respectivement exposé le refus de finalisation puis le grant de schéma manquant; ne pas les présenter comme preuve finale. Les deux fils de revue ont reçu une réponse et ont été résolus par l'agent après la CI; aucune décision humaine n'en est déduite.

Backend CELESTE OS toujours INACTIVE, VAL-002 sans réponse explicite. Aucune migration/bucket distant ni déploiement. Après déblocage, appliquer 20261003115835 puis 20261003160213, vérifier RLS/advisors/Storage et email. Aucun nouveau mail, aucune relance. Prochaine tranche : CE-004 catégories/dépenses/justificatifs sur ce socle; les contributions/caisse/remboursements restent inchangés.

Baseline 12 octobre recette anticipée et 15 pilote conservée; prévision conditionnelle utilisateurs 13/pilote 16 si backend réactivé au plus tard le 4. Recalculer ensuite sinon.

## Historique immédiatement précédent

# Lecture projet/mission fusionnée, 3 octobre 2026

PR #6 fusionnée : merge d0bcae185eb02350d3364e36cb6e7f32a819e40b. Code vérifié 5d0c991fe6ee43da3c12ed0d015e436e78f096bf, CI 37122978688 : cinq migrations, quatre suites SQL (fixtures annulées), security advisors sans warn/error, types, 24 tests domaine + 2 configuration, build et 14 parcours desktop/mobile sans skip. Six captures administration/prestataire/accords inactifs inspectées; artifact 11273842937. Revue P2 corrigée, testée et résolue. Aucune PR active restante.

Création projets/missions, lecture explicite, accord/révocation avec version, audit du membre visé. Aucun héritage entre projet et mission; prestataire limité aux missions. Accord conservé après suspension ou changement de rôle correctement marqué inactif et encore révocable. ADR-009 et rapport SCOPES. CE-003 reste partiel pour fichiers privés et capacités d’écriture métier; ne pas le considérer intégralement terminé. CE-007 n’a que ses périmètres persistés, pas phases/tâches.

Prochaine tranche prête dans CE-003 : fichiers privés, contrôle d’accès aux objets et capacités distinctes, avant CE-004 dépenses persistées. Étendre la pile CI au stockage si nécessaire; aucune ressource publique ou droit d’écriture implicite à partir de la lecture.

Backend CELESTE OS INACTIVE, VAL-002 toujours sans réponse explicite. Aucune pause FamilyRoot autorisée. Les quatre migrations précédentes existent à distance; seule 20261003115835_project_mission_scopes est en attente. Après déblocage, l’appliquer puis contrôler RLS/advisors et confirmation email avant onboarding/deploiement. Zéro donnée réelle, zéro déploiement. Prévision conditionnelle révisée recette utilisateurs 13 octobre et pilote 16 si backend réactivé au plus tard le 4; baseline 12/15 conservée, recette technique visée 12. Recalculer après déblocage sinon.

Validations : commentaires Agent exclus, résolution du fil par l’agent ne vaut pas décision humaine. Email_sent VAL-001 1a0fc206ec1ced41 exclu; pas de nouveau mail ni de réponse pertinente. VAL-002 pending; développement indépendant continue.

## Historique de préparation (statuts dépassés par le bloc ci-dessus)

PR active #6 https://github.com/Steve-Landry-NONO/Celeste-OS/pull/6. Première CI 37122065223 verte sur bdfe7d3 (14 parcours, quatre suites SQL, build). Ajout audit bénéficiaire en cours; vérifier la nouvelle tête et inspecter ses captures avant merge. Ne pas traiter la première CI comme preuve de la modification ultérieure.

# Reprise prioritaire — scopes, 3 octobre 2026

Branche feat/ce-003-scoped-access depuis main 407d50d. Création projets/missions, lecture explicite, accord/révocation, version et isolement. npm run check passe localement. SQL et navigateur locaux non exécutés; contrôler quatre suites SQL et quatorze parcours CI sans skip, puis captures desktop/mobile avant merge. ADR-009 et rapport SCOPES. CE-003 reste partiel pour fichiers et permissions d’écriture métier.

Aucune nouvelle réponse humaine; email_sent VAL-001 exclu. VAL-002 toujours pending, CELESTE OS INACTIVE et deux FamilyRoot actifs; ne pas mettre FamilyRoot en pause. Pas de migration distante ni déploiement. Prévision conditionnelle révisée recette utilisateurs 13 octobre et pilote 16, si backend disponible le 4; baseline 12/15 conservée, recette technique visée 12. Recalculer après déblocage sinon. Le développement indépendant continue.

## Historique précédent

# État final — invitations fusionnées, 3 octobre 2026

PR #2, #3 et #4 fusionnées après leurs contrôles. Code invitations 2582521f2d435e910a790ef0219e5ae78e357c33, CI 37110737675 : douze parcours sans skip, trois suites SQL, types, 26 tests unitaires et build passés. Captures desktop/mobile inspectées. Merge #4 49b5f1ffb62b4ab37368704b980bb0087c0fc2eb. Aucune PR de code restante.

Prochaine tranche : droits projet/mission refusés par défaut et gestion des accès, sur pile jetable tant que VAL-002 bloque le backend. Backend CELESTE OS INACTIVE, restore refusé pour quota occupé par deux projets FamilyRoot ; ne pas réappliquer les quatre migrations ou suspendre FamilyRoot sans accord. Aucun envoi automatique, compte réel ou déploiement web. Rapport INVITATIONS et ADR-008.

## Blocage actuel à lire en premier

CELESTE OS est INACTIVE. Restauration tentée et refusée pour quota gratuit : deux projets FamilyRoot actifs, FrequenceGestion déjà en pause. VAL-002 (#5) attend Steve. Ne pas suspendre FamilyRoot ou retenter en boucle. Les invitations ont passé les scénarios SQL avant la pause ; continuer les scopes et tests en CI jetable.

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
