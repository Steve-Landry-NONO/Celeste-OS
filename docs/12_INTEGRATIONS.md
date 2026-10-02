# Choix des outils et intégrations de CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Principe de choix

CELESTE OS conserve ses fonctions essentielles sans dépendre d’un assemblage imposé de Notion, Drive et Calendar. Chaque outil est sélectionné sur usage réel, simplicité mobile, coût constaté, accès disponible, portabilité, permissions et fiabilité. Le dossier ne présume pas qu’un connecteur de l’agent constitue une autorisation OAuth de l’application CELESTE OS.

## Comparaison des options

| Besoin | Option de départ | Alternatives | Déclencheur du choix |
|---|---|---|---|
| Code et spécifications | GitHub privé | GitLab si contrainte ultérieure | Dépôt accessible et protections |
| Données métier | PostgreSQL et Auth via Supabase proposés | Backend PostgreSQL géré autrement | Coût, résidence, sauvegarde et accès vérifiés |
| Documents versionnés | Stockage privé natif et métadonnées PostgreSQL | Drive ou stockage S3 compatible | Volume, coût, partage et version figée |
| Calendrier | Réunions et échéances natives, export ICS | Google Calendar ou Microsoft 365 | Calendrier réellement utilisé par l’équipe |
| Connaissance existante | Catalogue et documents CELESTE OS | Notion ou import Markdown | Documents existants à réutiliser |
| Maquettes | Tokens et composants versionnés | Figma pour revue visuelle | Charte et fichier Figma accessibles |
| Suivi du travail de développement | Backlog CSV et issues GitHub | GitHub Projects, Linear | Équipe et accès disponibles |
| Déploiement web | Hébergement avec previews | Vercel ou Sites selon contraintes | Build, secrets, domaine et coûts vérifiés |
| Diffusion mobile | Builds Expo de développement | EAS ou builds locaux | Comptes, appareils et configuration disponibles |

Ne pas déclarer une solution « meilleure » sans critères ni mesure. Les tarifs et quotas sont vérifiés à la décision, sans hypothèse de gratuité universelle ou de coût nul des stores.

## Contrat commun des adaptateurs

Chaque adaptateur expose fournisseur, capacités, statut de connexion, scope consenti, mapping local externe, synchronisation, révocation et export. La couche métier ne contient pas d’identifiants fournisseur codés en dur. Les secrets restent côté serveur. Les traitements portent une clé d’idempotence et journal de tentative. Un échec fournisseur ne supprime pas les données natives.

Pilote : documents natifs, réunions natives et liens externes. Premier connecteur éventuel : sens unique et périmètre réduit après preuve de besoin. Une synchronisation bidirectionnelle exige gestion des suppressions, conflits, version du fournisseur et décision de priorité explicitement testées.

## Accès observés au 2 octobre

GitHub : compte connecté Steve-Landry-NONO confirmé ; aucun dépôt CELESTE accessible trouvé. Recherche et lecture des fichiers nécessaires possibles dans les outils disponibles. Le badge CELESTE a été consulté. Figma n’a pas de capacité callable visible dans cette session malgré sa mention par l’utilisateur ; aucun accès à un fichier Figma n’est présumé. Notion et Drive ne sont pas nécessaires au dossier créé ici et leur accès applicatif n’a pas été validé. Les capacités backend et hébergement devront être vérifiées sur le projet précis avant mutation.

## Connexions à demander au moment utile

Dépôt privé CELESTE OS et droit de lecture écriture, projet Supabase de développement si choix retenu, hébergement choisi, accès à la charte source et éventuellement Figma, puis Expo et distribution mobile. Calendar, Drive et Notion sont demandés seulement pour l’intégration retenue. Aucun besoin de Slack ou de contacts personnels pour démarrer.
