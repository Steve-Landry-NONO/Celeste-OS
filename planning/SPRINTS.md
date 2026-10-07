# Programme des sprints de CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Cadence proposée

Du 2 au 15 octobre, un incrément quotidien, une PR testable et un rapport court. Créneau proposé l’après-midi pour distinguer CELESTE des développements FamilyRoot le matin et Tontine prévus le soir. La tâche automatisée ne constitue pas une réservation de capacité ni une garantie qu’un environnement d’exécution sera disponible. Toute session non exécutée est rapportée comme bloquée.

## Sprint 1 du 2 au 8 octobre

Objectif : fondations, finance correcte, tâche utilisable et reprise fiable. À sa sortie, les membres de test peuvent se connecter, créer des tâches, enregistrer une dépense et consulter des contributions exactes sans fuite entre organisations.

| Jour | Date | Incrément | Preuve et dépendance |
|---|---|---|---|
| J1 | 2 octobre | Dossier, backlog, décisions et initialisation dès accès | Dossier livré ; repo et choix de stack à confirmer |
| J2 | 3 octobre | Monorepo, CI, Auth et organisation | Connexion réelle et refus interorganisation |
| J3 | 4 octobre | Dépenses, catégories et justificatifs privés | Saisie persistée et contrôle fichiers |
| J4 | 5 octobre | Versements, caisse et égalisation | Exemple financier complet et doubles soumissions |
| J5 | 6 octobre | Projets, phases, tâches et Aujourd’hui | Création attribution et échéance affichées |
| J6 | 7 octobre | Navigation Expo et finance mobile | Parcours sur appareil ou preuve de blocage natif |
| J7 | 8 octobre | Revue sprint 1 et consolidation | Recette Steve, correctifs et état de reprise |

## Sprint 2 du 9 au 15 octobre

Objectif : documents versionnés, prestataires, réunions et pilote exploitable avec livraison anticipée si possible.

| Jour | Date | Incrément | Preuve et dépendance |
|---|---|---|---|
| J8 | 9 octobre | Catalogue et upload de versions | Deux versions et ancienne version intacte |
| J9 | 10 octobre | Revue publication et catalogue mobile | Approbation sur empreinte et conflit concurrent |
| J10 | 11 octobre | Mission prestataire et livrable | Prestataire limité à sa mission |
| J11 | 12 octobre | Réunions, décisions et activité | Action reliée au compte rendu ; recette anticipée |
| J12 | 13 octobre | Cohérence des clients, exports et backup | Export autorisé et restauration base fichiers |
| J13 | 14 octobre | Recette des trois fondateurs et correctifs | Parcours complets et risques restants |
| J14 | 15 octobre | Release pilote et passage à l’usage | Tag, changelog, mode d’emploi et décision d’ouverture |

## Règles de livraison

Un incrément termine un parcours de bout en bout et met à jour son état réel. On évite d’ouvrir simultanément plusieurs grandes PR touchant les mêmes tables. Une branche par incrément, PR vers main protégée pour ce nouveau produit sauf stratégie différente décidée au démarrage. Steve valide les jalons produit ; il n’a pas besoin de relire chaque correction réversible.

Si une dépendance reste absente à J2, conserver le calendrier initial comme baseline, consigner la date de déblocage et établir un calendrier révisé. Ne pas faire passer les journées documentaires pour des journées de code ni reporter discrètement la fin du pilote.

## Prévision révisée — 3 octobre 2026

Backend distant en pause, VAL-002 sans décision. Le code et les tests jetables continuent. Baseline 12 octobre (recette anticipée) et 15 (pilote) conservée. Prévision conditionnelle : recette utilisateurs le 13, ouverture pilote le 16, si backend réactivé au plus tard le 4; le 12 reste cible technique sur pile jetable. Marge pour revalidation distante et onboarding, sans garantie des lots restants. Après le 4 sans accès, recalculer les dates à partir du déblocage réel; ne pas ouvrir avant les vérifications complètes.

Avance technique du 3 octobre : le socle des fichiers privés de J3 est en PR #7 et vérifié sur pile jetable. Cela réduit le risque des justificatifs, mais ne termine pas CE-004 : catégories, dépenses, règles d'écriture et lien justificatif restent à développer. L'avance ne compense pas l'absence de revalidation distante et d'onboarding.

## Prévision révisée — 4 octobre 2026

CE-004 est écrit sur le socle fusionné : catégorie, dépense personnelle, justificatif du même périmètre et contribution dérivée unique. Le contrôle local passe ; SQL et navigateur attendent la CI. CELESTE OS est toujours INACTIVE et VAL-002 reste sans réponse explicite. La condition de réactivation au plus tard le 4 octobre n'est donc pas satisfaite.

La baseline initiale reste 12 octobre pour la recette anticipée et 15 pour le pilote, à titre de comparaison. Prévision distante révisée : recette utilisateurs le 14 octobre et pilote le 17 si le backend est réactivé au plus tard le 5 octobre à midi. Après cette limite, décaler les deux dates d'au moins un jour par jour de blocage supplémentaire. La cible technique sur pile jetable reste le 12 ; aucune ouverture réelle avant migrations distantes, onboarding et recette complète.


## Prévision révisée — 5 octobre 2026

CE-006 est en PR #10 avec verrou persistant du remboursement, sans activation ni politique inventée. La limite conditionnelle du 5 octobre à midi est dépassée : CELESTE OS reste INACTIVE et VAL-002 sans réponse humaine.

La baseline du 12 octobre pour la recette anticipée et du 15 pour le pilote reste la référence initiale. Prévision distante : recette utilisateurs le 15 octobre et pilote le 18 si le backend est réactivé au plus tard le 6 octobre à midi. Après cette limite, ajouter au moins un jour aux deux dates par jour de blocage. La recette technique sur pile jetable reste visée le 12 ; aucune ouverture réelle sans migrations distantes, onboarding et recette complète.

## Prévision révisée — 7 octobre 2026

CE-007 persiste phases, tâches et vue Aujourd’hui dans la PR #11. La tête de code passe les dix migrations, neuf suites SQL/RLS, security advisors, build et 20 parcours desktop/mobile sans skip ; les captures ont été inspectées. CELESTE OS reste INACTIVE et VAL-002 sans réponse humaine.

La baseline initiale reste le 12 octobre pour la recette anticipée et le 15 pour le pilote. Si le backend est réactivé au plus tard le 7 octobre à midi, la prévision distante devient recette utilisateurs le 16 octobre et pilote le 19. Après cette limite, ajouter au moins un jour aux deux dates par jour de blocage. La recette technique sur pile jetable reste visée le 12 ; aucune ouverture réelle sans migrations distantes, onboarding et recette complète.
