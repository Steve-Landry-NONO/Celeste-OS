# Navigation et identité visuelle de CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Direction

L’application conserve l’univers CELESTE et privilégie des cartes lisibles, des espaces généreux, des actions claires et une navigation à une main. Airbnb inspire la hiérarchie et l’aisance mobile ; Pinterest inspire les grilles d’inspiration et les contenus visuels. Les écrans restent conçus pour les tâches CELESTE, sans copier les interfaces ni assets de ces applications.

Le badge historique consulté montre ivoire, doré, terracotta et texte sombre. Il fournit une référence visuelle, pas les valeurs officielles d’une charte. Les valeurs suivantes sont donc des tokens de travail proposés, à remplacer par la charte originale avant gel graphique.

| Token | Proposition | Usage |
|---|---|---|
| background | #F5F1E8 | Fond principal |
| surface | #FFFFFF | Cartes et formulaires |
| ink | #242320 | Texte principal |
| muted | #6D6256 | Métadonnées, après test de contraste |
| brand | #B65B3B | Actions principales terracotta |
| gold | #BC8736 | Accent décoratif, pas texte courant petit |
| success | #276749 | Validé ou payé avec libellé et icône |
| danger | #B42318 | Erreur et retard avec libellé et icône |

Corps sans empattement très lisible ; une police de titre avec empattement peut rappeler le logo si sa licence et sa lisibilité sont confirmées. Ne pas choisir arbitrairement la typographie officielle. Rayon cartes proposé 20 pixels, échelle d’espacement 4, 8, 12, 16, 24, 32. Cibles tactiles proposées 44 pixels minimum. Vérifier contraste, zoom et lecteurs d’écran au lieu de considérer la palette comme accessible par défaut.

## Navigation

Le mobile contient Accueil, Travail, Action, Activité et Profil. Finances, Documents, Réunions et Prestataires sont des destinations visibles depuis l’accueil et Travail selon les droits. Le web propose une barre latérale plus explicite et le même vocabulaire. Chaque détail conserve un retour cohérent et une action principale. L’espace prestataire réutilise la navigation avec seulement les modules autorisés.

## Écrans à produire

| Écran | Contenu principal | Action majeure | État vide |
|---|---|---|---|
| Connexion | Invitation, compte, récupération | Se connecter | Expliquer comment obtenir l’accès |
| Aujourd’hui | Priorités, validations et échéances | Ouvrir l’objet prioritaire | Ajouter sa première tâche autorisée |
| Travail | Projets, phases et tâches | Créer une tâche | Créer un projet ou rejoindre un projet |
| Projet | Progression calculée, membres et onglets | Ajouter une action | Aucun avancement calculé sans tâche |
| Finance | Coûts, contributions, caisse et engagements | Ajouter une dépense | Reconstituer les dépenses réelles |
| Contributions | Totaux, référence et reste à apporter | Enregistrer un versement | Aucune contribution confirmée |
| Dépense | Champs et pièce justificative | Confirmer la saisie | Formulaire lisible et contexte rappelé |
| Documents | Catalogue, type et version publiée | Ajouter un document | Déposer le premier document |
| Document | Historique, changements et validations | Proposer une version | Aucune version publiée |
| Prestataire | Mission, livrables et paiements propres | Déposer le livrable | Aucune mission attribuée |
| Réunion | Ordre du jour, décisions et actions | Ajouter une décision | Préparer le premier ordre du jour |
| Activité | Historique et notifications | Ouvrir la ressource | Rien de nouveau |

Les maquettes utilisent des données fictives clairement marquées. Les écrans réels restent vides tant que les informations n’ont pas été saisies. Les photos éventuelles doivent avoir un droit d’usage et un rôle utile ; aucune illustration n’est nécessaire pour présenter un montant ou un formulaire.

## États et accessibilité

Chaque écran a chargement, vide, erreur, accès refusé et contenu disponible. Les formulaires expliquent les erreurs à proximité du champ et conservent les valeurs. Les icônes ont un nom accessible ; la couleur ne porte jamais seule un statut. La barre inférieure respecte les zones sûres et le clavier ne cache pas le bouton de confirmation. Le reçu peut être prévisualisé avant envoi.

## Validation graphique

Obtenir logo source et charte, construire les tokens, produire les parcours finance et documents, tester sur un téléphone de 360 pixels puis obtenir la revue de Steve et Maeva. Figma est une option de conception ; son absence n’empêche pas de documenter les composants dans le dépôt. Aucun fichier Figma n’a été créé dans cette livraison.
