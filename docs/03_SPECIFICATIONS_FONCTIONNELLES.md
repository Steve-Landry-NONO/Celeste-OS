# Spécifications fonctionnelles de CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Connexion et première ouverture

Le membre reçoit une invitation pour une organisation et un rôle précis. Le lien expire, ne peut être réutilisé et ne crée pas de compte supplémentaire s’il est déjà membre. À la première ouverture, il configure son nom affiché, fuseau et préférences. La sélection d’organisation est prévue sans coder CELESTE en dur. Une session révoquée ne peut plus effectuer d’opération sensible, même si un ancien jeton existe encore.

## Accueil Aujourd’hui

L’accueil présente les tâches attribuées à la personne, les retards, les validations qu’elle peut traiter, les prochaines réunions auxquelles elle a accès et les paiements autorisés. Les compteurs et listes utilisent le même filtre de permissions. Une tâche due aujourd’hui dépend du fuseau de l’organisation ; les réunions conservent un instant UTC et un fuseau. Une échéance financière conserve une date civile.

Les éléments urgents passent en premier, puis les échéances et la date de création. Le produit affiche un état vide utile si aucune donnée n’existe. Une progression de projet est calculée à partir des tâches éligibles terminées, avec exclusions explicites des tâches annulées et aucun pourcentage arbitraire. Un projet sans tâche affiche « progression non calculée ».

## Projets et travail

Un projet a un titre, une description, un responsable, des membres, un statut, des phases et des jalons. Une tâche possède un responsable unique, une échéance optionnelle, un statut, une priorité et un périmètre. Les personnes supplémentaires sont abonnées ou contributrices, jamais un groupe ambigu de responsables. Statuts proposés : à faire, en cours, bloquée, à valider, terminée, annulée. Passer à bloquée demande une raison. Une validation possède un décideur identifié.

La roadmap présente les phases et jalons, leurs dates et leur état. Les dépendances avancées arrivent après le pilote. Archiver un projet conserve dépenses, décisions et documents. Le déplacement d’un objet entre projets vérifie les permissions dans l’ancien et le nouveau périmètre.

## Saisie de dépense sur téléphone

L’utilisateur ouvre Action puis Dépense. Champs requis : libellé, montant positif, devise, date, source des fonds et catégorie. Projet, phase, prestataire, moyen de paiement, pièce et note sont optionnels selon la politique choisie. Si la source est personnelle, il indique le payeur et le traitement proposé : contribution initiale ou remboursement futur autorisé. Le régime initial sélectionne contribution par défaut.

Une catégorie peut être créée depuis la saisie par un profil habilité, sans perdre le formulaire. Les catégories portent un identifiant stable ; le renommage ne modifie pas l’historique des dépenses. Une catégorie utilisée se désactive, elle ne se supprime pas. Une sous-catégorie ne peut former de cycle. La phase choisie doit appartenir au projet choisi.

La photographie demande la permission caméra au moment de l’action. L’utilisateur peut choisir un fichier si la permission est refusée. La pièce reste privée. Le formulaire conserve un brouillon pendant un échec réseau, puis réessaie avec la même clé d’idempotence. La confirmation montre l’effet distinct sur le coût, la caisse et la contribution.

## Finance et validation

Les fondateurs voient contributions cumulées, référence d’égalisation, reste à apporter, solde de caisse, coûts payés et engagements non payés. Le statut « à confirmer » reste séparé des montants retenus. Les filtres projet, phase, catégorie et période filtrent les coûts ; ils ne changent pas la référence globale d’égalisation sans indication explicite.

Les dépenses proposées sont confirmées par un profil finance habilité selon la politique du pilote. Les remboursements suivent le régime distinct de FINANCE. Le coût initial inconnu de Maeva affiche « à reconstituer » sans inventer de montant. Les exports incluent devise, traitement, source, état et date de confirmation.

## Prestataire et livrables

Le fondateur crée une fiche prestataire, une mission, les membres invités, le projet lié, les livrables et les jalons de paiement. Le prestataire voit sa mission, les fichiers partagés explicitement, ses actions, ses réunions et ses échéances. L’équipe valide ou refuse un livrable avec motif et version du document. Un livrable accepté ne prouve pas qu’un paiement a eu lieu. Un jalon payable crée un engagement, puis un paiement effectif relié à une dépense.

## Réunions et décisions

Une réunion comporte titre, début, fin, fuseau, participants, ordre du jour et documents. Le pilote conserve les notes et décisions saisies manuellement. Une décision peut créer une tâche liée avec responsable et échéance ; l’action reste identifiable depuis le compte rendu. Toute modification ultérieure du compte rendu crée une version lorsqu’il a été approuvé. Le produit n’enregistre pas les participants sans consentement explicite et fonctionnalité prévue.

## Documents et inspirations

Le catalogue couvre CDC, chartes, contrats, notes, comptes rendus, supports et spécifications de CELESTE OS. Chaque document a un propriétaire, un périmètre et une version publiée de référence. Les inspirations pourront être affichées en grille visuelle avec attribution et lien à un projet ; elles n’obtiennent pas automatiquement le statut de document approuvé.

Le détail permet de voir le fichier, l’historique, les changements, les validateurs et les objets liés. Les règles complètes sont dans GESTION_DOCUMENTAIRE. Une URL externe est indiquée comme référence externe ; sans copie figée et empreinte, elle n’est pas annoncée comme version immuable.

## Action et notifications

Le bouton Action propose tâche, dépense, document et réunion selon les droits. Les autres actions se trouvent dans les modules concernés. Notifications internes persistées, marquage lu et liens vers la ressource ; masquer une notification ne valide jamais l’objet. Les changements ordinaires peuvent être regroupés. Les push mobiles arrivent après consentement et tests de livraison. Aucun badge ne divulgue une ressource devenue inaccessible.

## Erreurs et concurrence

L’interface distingue absence de données, absence de droits, session expirée et erreur réseau. Elle n’affiche jamais un succès avant réponse persistée. Un conflit de version propose de recharger et comparer. Les écritures financières sont en ligne dans le pilote ; un brouillon hors ligne ne modifie pas les totaux. La déconnexion efface les données sensibles mises en cache sur l’appareil.
