# Registre des décisions de CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Statuts

Décidé signifie demandé explicitement par Steve dans la conversation. Proposé signifie choix de ce dossier à confirmer. Vérifié signifie fait observé avec preuve. Une proposition n’est pas une approbation et la génération d’un document ne valide pas son contenu métier.

| ID | Décision | Statut | Source ou conséquence |
|---|---|---|---|
| D-001 | Construire CELESTE OS comme outil central dès maintenant | Décidé | Demande fournie le 2 octobre |
| D-002 | Mobile rapide et DA CELESTE épurée | Décidé | Demande et contexte fournis |
| D-003 | Dépenses initiales retenues en contribution, pas remboursement | Décidé | Correction financière de Steve |
| D-004 | Garder remboursement pour régime futur avec caisse suffisante | Décidé | Demande actuelle |
| D-005 | Catégories dynamiques, coûts par projet et phase | Décidé | Demande financière |
| D-006 | Gestion et versionnement des documents CELESTE et CELESTE OS | Décidé | Demande actuelle |
| D-007 | GitHub central et documentation persistante pour agents | Décidé | Demande actuelle |
| D-008 | Notion Drive Calendar restent remplaçables | Décidé | Demande actuelle |
| D-009 | Pilote utilisable prioritaire à deux semaines | Décidé | Choix explicite lors du cadrage |
| ADR-001 | Next.js Expo TypeScript Supabase comme stack de travail | Proposé | Partage domaine contrats et tokens ; UI web native distinctes |
| ADR-002 | Finance atomique serveur, écritures dérivées et contre-écritures | Proposé | Éviter doublons et préserver audit |
| ADR-003 | GitHub pour docs techniques et catalogue natif pour docs métier | Proposé | Une source éditable par document |
| ADR-004 | Documents natifs et connecteurs facultatifs au pilote | Proposé | Éviter dépendances sans usage établi |
| ADR-005 | Remboursements par avance distincte de contribution | Proposé | Maintenir équité dans régime futur |
| OBS-001 | Compte GitHub Steve-Landry-NONO accessible, aucun dépôt CELESTE trouvé | Vérifié | Recherche repositories et installations le 2 octobre |

## Questions ouvertes et effet

| ID | Question | Hypothèse de travail | Bloque quoi |
|---|---|---|---|
| Q-001 | Lien du dépôt privé CELESTE OS | Nom recommandé celeste-os | Centralisation et code distant |
| Q-002 | Réserve minimale pour rembourser | Non définie, régime désactivé | Activation des remboursements |
| Q-003 | Approbateurs des dépenses et documents | Fondateurs habilités ; remboursement sans auto-approbation | Politique définitive avant données réelles |
| Q-004 | Devise et période d’équilibrage | EUR et période initiale de lancement | Calcul multidevise et clôture réelle |
| Q-005 | Charte logo et typographies sources | Palette provisoire issue des badges | Gel graphique |
| Q-006 | Projets backend hébergement et Expo | Comptes de développement distincts | Déploiement et test natif |
| Q-007 | Vrais montants dépensés et fonds déjà existant | À reconstituer, aucun montant inventé | Import financier réel |

Les questions Q-002 et Q-007 n’empêchent pas de développer les structures et scénarios avec données synthétiques. Elles empêchent de présenter des chiffres réels et d’activer les politiques correspondantes.

## Décisions du démarrage

D-010 décidé : dépôt privé exact Steve-Landry-NONO/Celeste-OS fourni par Steve.
D-011 décidé : plusieurs cycles de développement quotidiens dès aujourd’hui ; cadence proposée et activée à trois reprises.
D-012 décidé : demandes à Steve par email si besoin et conservation des demandes et réponses dans GitHub.
OBS-002 vérifié : GitHub lecture écriture et profil Gmail disponibles ; aucun backend CELESTE OS identifié. Q-001 est résolue, Q-006 reste ouverte pour Auth et persistance.

## Correction de précision — 2 octobre 2026

OBS-003 vérifié : la revue automatique de PR #2 a identifié une perte d’un centime lors de la division flottante pour afficher `90071992547409,91`. La correction applique FIN-R01 jusqu’à l’affichage : partie entière en BigInt et centimes exacts, dans le package partagé. Le périmètre EUR et les règles métier restent ceux du socle. Les tests, preuves et limites sont consignés dans `reports/2026-10-02_PRECISION.md`. Ce constat technique ne constitue aucune validation humaine.

## Contrat Aujourd’hui — 2 octobre 2026

OBS-004 vérifié localement : le contrat de sélection de « Aujourd’hui » applique un même périmètre organisation/projet/mission à la liste et aux compteurs, puis limite la liste personnelle au responsable. La progression de projet exclut les tâches annulées et les missions non autorisées ; elle reste non calculée sans tâche éligible. Le résultat web est un scénario fictif, sans preuve d’autorisation serveur ni persistance. Voir `reports/2026-10-02_TODAY.md`.

## Backend fourni — 2 octobre 2026

D-013 décidé : Steve autorise la création d’un projet dédié dans l’organisation Supabase `klgwcghsildwhwevzncz`, puis fournit l’URL `https://vnmlomqxhnjucrrhvkmk.supabase.co` comme backend cible avec « connecté ». Ne pas créer de doublon ; poursuivre sur cette référence après vérification.

OBS-005 vérifié : les appels administratifs du connecteur Supabase renvoient désormais `Unknown tool`. Le plugin est observé installé et actif. Cette erreur ne prouve ni absence du projet ni refus d’accès. Le rattachement du projet à l’organisation, son contenu et les permissions restent non vérifiés. Q-006 est partiellement résolue pour le choix du backend ; Auth et persistance restent bloqués par le connecteur, l’hébergement et Expo restant à préparer. Voir le rapport BACKEND et l’issue VAL-001.

## Création dans l’organisation personnelle et quota — 2 octobre 2026

D-014 décidé : Steve autorise explicitement la création de CELESTE OS dans `Steve-Landry-NONO’s Org` (`jmbijvhlwxgoirjffcic`), après annonce du coût 0/mois. Cette décision remplace D-013 pour la cible de création, sans autoriser modification ou suspension d’un autre produit.

OBS-006 vérifié : le connecteur fonctionne ; l’ancienne organisation et l’ancien projet renvoient un refus de permission. Le coût de création annoncé pour l’organisation personnelle est 0/mois, mais la tentative de création est rejetée pour quota de 2 projets gratuits actifs atteint. Les projets actifs visibles sont FamilyRoot et FrequenceGestion. Aucun nouveau projet ni changement des projets existants. Voir le rapport SUPABASE_QUOTA.

## Backend opérationnel — 2 octobre 2026

D-015 décidé : Steve autorise la mise en pause de FrequenceGestion pour libérer la place gratuite nécessaire à CELESTE OS. Cette pause ne constitue pas une autorisation de suppression, de réinitialisation ou de restauration automatique.

OBS-007 vérifié : FrequenceGestion pncckdmpmrruhqzpfgdo devient INACTIVE. CELESTE OS est créé dans jmbijvhlwxgoirjffcic, région eu-west-3, référence vxdneuoglidyngzdfmjc. État ACTIVE_HEALTHY et requête SQL select 1 vérifiés ; aucune table public ni migration. L’ancien projet vnmlomqxhnjucrrhvkmk n’est plus la cible. VAL-001 est résolue pour identification et accès du backend. Auth et RLS restent à implémenter ; Q-006 reste ouverte uniquement pour les autres environnements, l’hébergement et Expo. Voir SUPABASE_READY.

## Auth et organisations — 2 octobre 2026

ADR-006 implémentée comme choix technique de l’incrément autorisé : identité Supabase, permissions en base privée, RLS, cookies SSR et RPC atomiques. Les comptes peuvent créer leur propre espace sans accès implicite à CELESTE. Aucun droit réel de fondateur n’a été attribué.

OBS-008 vérifié : deux migrations appliquées sur vxdneuoglidyngzdfmjc, 26 assertions RLS passées, fixtures annulées ; quatre tables publiques et zéro donnée de test résiduelle. Connexion web écrite, build local passé et huit parcours navigateur CI réussis sans skip, captures inspectées. La confirmation email et les comptes réels restent à préparer. Voir ADR-006 et rapport AUTH.

## Administration des membres — 3 octobre 2026

OBS-009 : CE-003 reprend la PR #2 existante. UI des appartenances existantes via manage_membership, sans nouveau privilège ni migration. Chaque soumission relit l’acteur et transmet la version affichée ; RPC vérifie de nouveau les droits, sérialise les écritures et protège le dernier administrateur. Aucune attribution réelle de droits ni validation métier déduite. Choix technique : références de comptes visibles aux seuls administrateurs, sans élargir own_profile_read ; noms et invitations restent une suite nécessaire avant onboarding. Tests navigateur nouveaux en attente de CI au moment de cette écriture.

OBS-010 vérifié le 3 octobre : CI 37108614505 réussie sur 0a23faf, dix tests navigateur sans skip et 26 assertions SQL. Captures membres desktop/mobile inspectées. Protection du dernier admin, conflit, champ falsifié, suspension, réactivation, audit et refus du membre prouvés sur pile locale jetable. Aucune donnée distante ni attribution réelle modifiée ; CE-003 reste partiel pour invitations, noms et scopes.

## Annuaire administratif — 3 octobre 2026

ADR-007 implémentée, choix technique de CE-003 : joindre noms et appartenances dans une fonction privée contrôlée par membership.manage sur l’organisation demandée, wrapper public SECURITY INVOKER, search_path vide, EXECUTE retiré à PUBLIC/anon. L’alternative consistant à élargir la RLS profiles à tous les membres partageant une organisation est écartée : elle divulguerait des profils aux prestataires et futurs scopes mission. L’annuaire reste réservé aux admins actifs, y compris pour identifier les accès suspendus qu’ils peuvent réactiver. Aucun contact ni metadata Auth renvoyé. Noms rendus comme texte, références conservées pour différencier les homonymes. Aucune nouvelle règle financière ni approbation humaine déduite. Migration, refus SQL et recette navigateur écrits ; CI en attente.

OBS-011 vérifié : code annuaire 61da027 passe CI 37109445474 (dix tests navigateur sans skip, contrôles SQL, types, 26 tests unitaires, build). Captures noms longs desktop/mobile et cartes finales mobile inspectées. La fonction existe déjà à distance avec définition identique et migration 20261003082224 ; scénario SQL annuaire passé avec ROLLBACK et zéro fixture résiduelle. Pas de réapplication. Fichier de migration aligné sur ce numéro. Migration d’invitations 20261003082235 et éditions locales concurrentes observées et préservées ; leur comportement n’est pas validé par cet incrément. La fusion de #2 ne vaut pas décision métier humaine. Annuaire en PR #3, non fusionné et non déployé.

## Invitations — 3 octobre 2026

ADR-008 : invitation d’organisation à adresse Auth confirmée, code aléatoire affiché une fois, empreinte privée, expiration 7 jours, révocation et consommation atomique. Transmission manuelle pour ce lot. Pas de changement de rôle ou réactivation implicite pour les membres existants ; refus si le créateur a perdu son rôle admin actif. SQL distant et contrôle local passés ; recette navigateur en attente. Steve autorise les merges des chantiers clos dans son instruction actuelle, sans nouvelle demande générale.

OBS-012 : invitations vérifiées par CI 37110737675, douze parcours sans skip et captures inspectées, puis PR #4 fusionnée sur autorisation explicite de Steve. Backend ultérieurement observé INACTIVE ; tentative de restore refusée pour quota, sans pause d’autre projet. VAL-002 attend une décision, code et persistance testée sur base jetable restent disponibles.

## Périmètres de lecture — 3 octobre 2026

ADR-009 : périmètres projet/mission, lecture explicite sans héritage, prestataires limités aux missions, liens organisation/parent contraints. Création et accords par admin actif, version obligatoire et verrou commun avec les appartenances. CI finale 37122978688 passe sur 5d0c991 : quatre suites SQL, security advisors, types, 26 tests unitaires, build et 14 parcours sans skip. Six captures inspectées, retour P2 accords inactifs résolu, PR #6 fusionnée d0bcae1. Aucun droit d'écriture métier ajouté. VAL-002 toujours sans réponse explicite.

## Fichiers privés — 3 octobre 2026

ADR-010 : bucket privé, métadonnées par périmètre, dépôt serveur validé et téléchargement signé court. L'écriture de fichier est distincte de la lecture et ne s'hérite pas entre projet et mission. Les clients authentifiés ne peuvent ni injecter directement un objet, ni finaliser une réservation ; la finalisation serveur partage le verrou des révocations et relit les droits. Ce choix répond aux deux retours de revue de PR #7 sans modifier les règles financières ou documentaires. Backend distant inchangé tant que VAL-002 reste pending.

OBS-013 : tête `3e9473d2` vérifiée par CI 37137848450 : six migrations, cinq suites SQL avec rollback, security advisors sans alerte, 24 tests domaine + 3 configuration, build et 16 parcours desktop/mobile sans skip. Captures lecture après révocation du dépôt inspectées. PR #7 fusionnée en `45a701b9`. Les réponses et résolutions de revue ont été écrites par l'agent et ne valent pas validation métier humaine.

## Dépenses personnelles persistées — 4 octobre 2026

ADR-011 implémentée comme choix technique de CE-004 : seule la dépense personnelle en EUR est confirmable dans ce lot. Elle produit dans la même transaction une contribution unique, exige une catégorie et un justificatif privé prêt du même périmètre, et ne touche jamais la caisse. La clé d'idempotence lie le payload complet ; les écritures confirmées sont immuables. Les dépenses de fonds, versements et remboursements restent non exposés jusqu'aux écritures dédiées. Ce découpage applique D-003 et FIN-R02 sans anticiper Q-002 ou inventer de montant réel.

OBS-014 vérifié localement : types, 24 tests domaine, 3 configuration et build passent. SQL/RLS, security advisors et navigateur attendent la CI jetable ; aucune réussite n'est encore affirmée pour ces contrôles. Backend CELESTE OS observé INACTIVE et VAL-002 sans commentaire ni email humain distinct au 4 octobre.

OBS-015 vérifié : tête CE-004 `446669a65` passée par CI 37201096755 : sept migrations sur pile jetable, six suites SQL avec rollback, security advisors sans alerte, 24 tests domaine + 3 configuration, build et 18 parcours desktop/mobile sans skip. Artifact 11303056206 et captures Finance inspectés. Les retours de revue ont conduit à conserver l’historique d’un contributeur suspendu tout en séparant son éligibilité future, et à calculer la date civile selon `organizations.timezone` côté serveur et interface. PR #8 fusionnée en `0a046e3ce2a14c763e19fa8598a90d2ba724df41`. Aucune migration distante, activation de caisse/remboursement ou validation humaine n’est déduite des commentaires et résolutions de l’agent.

## Caisse et égalisation persistées — 4 octobre 2026

ADR-012 implémentée comme choix technique de CE-005 : une caisse commence à zéro ; un versement crée une contribution et une entrée de caisse, une dépense du fonds crée un coût et une sortie sans contribution, et un avoir fournisseur réduit le coût net tout en restaurant la caisse d’origine. Les totaux restent dérivés, les écritures confirmées immuables et idempotentes, et aucun remboursement de fondateur n’est exposé. La référence d’égalisation est le maximum des contributions des fondateurs actifs ; un écart négatif ne déclenche jamais de remboursement.

OBS-016 vérifié : tête de code `7a024d1945ec346f1da4e7c36839d9310bf4fc98`, CI 37286210732 réussie : huit migrations jetables, sept suites SQL avec rollback, security advisors sans alerte, contrat TypeScript, 24 tests domaine + 3 configuration, build et 18 parcours desktop/mobile sans échec ni skip. Artifact 11334402484 et captures Finance inspectés. Une première CI a détecté le contrat TypeScript incomplet ; il a été corrigé et le workflow appelle explicitement la nouvelle suite SQL. La revue P2 a conduit à refuser transactionnellement les agrégats d’organisation hors plage entière sûre et à tester deux fondateurs sur deux caisses ; fil résolu par l’agent après CI verte, sans validation humaine déduite. PR #9 reviewable, sans migration distante.

OBS-017 vérifié le 5 octobre : PR #9 fusionnée en `5df68984b5675297bfabc0bc66c0722b9bdf5bc9` sous l’autorisation EV-0016 après CI finale 37286826255 sur `f1be4dcddde03bdb36c66eaf2c656593ab945206`. Huit migrations jetables, sept suites SQL avec rollback, security advisors, contrat TypeScript, 24 tests domaine + 3 configuration, build et 18 parcours desktop/mobile sans skip passent. Le retour P2 automatisé sur la plage sûre a été corrigé, répondu et résolu par l’agent ; le nom du compte GitHub ne transforme pas cette réponse en décision humaine. Aucun déploiement ni migration distante.


## Verrou persistant des remboursements — 5 octobre 2026

ADR-013 implémentée comme choix technique de CE-006 : une politique versionnée `disabled` est créée pour chaque organisation, lisible seulement par `finance.read`, immuable et contrainte à ne contenir ni réserve, ni approbateur, ni référence de décision. Aucun endpoint de demande, activation ou paiement n’est exposé. Le verrou ne résout pas Q-002 ou Q-003 et ne requalifie aucune contribution historique.

OBS-018 : avant développement, aucune PR CE-006 concurrente n’est ouverte. VAL-002 n’a aucun commentaire humain ; Gmail ne retourne que le message sortant `1a0fc206ec1ced41` déjà classé `email_sent`, exclu. CELESTE OS reste INACTIVE et aucun projet tiers n’est modifié. PR #10 porte la migration, les contrôles SQL, le rendu Finance et la traçabilité ; sa CI est en cours et aucune réussite en attente n’est affirmée.

OBS-019 : la limite conditionnelle du 5 octobre à midi est dépassée. La baseline 12/15 reste historique ; la prévision distante devient recette utilisateurs le 15 et pilote le 18 si le backend est réactivé au plus tard le 6 à midi, puis au moins +1 jour par jour de blocage supplémentaire. La cible technique jetable demeure le 12.
