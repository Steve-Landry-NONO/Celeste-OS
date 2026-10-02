# Gestion et versions des documents CELESTE

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Catalogue commun

La plateforme doit gérer les documents métier de CELESTE dès le pilote et ceux de CELESTE OS ensuite ou dès qu’ils sont importés. Un document représente une identité stable ; chaque version représente un contenu précis. Types initiaux : cahier des charges, charte graphique, charte d’usage, spécification, contrat, compte rendu, procédure, présentation et autre. Les types peuvent évoluer sans refaire les documents.

Une fiche comporte organisation, espace ou projet, titre, code stable, type, propriétaire, confidentialité, tags, langue, version publiée courante et liens vers tâches, décisions, prestataires ou releases. Le champ confidentialité reste accompagné de droits effectifs ; un tag « confidentiel » seul ne protège pas un fichier.

## Versionnement

Chaque version conserve numéro, auteur, date, fichier ou contenu figé, empreinte SHA-256, MIME, taille, résumé des modifications, version précédente et origine. Une version publiée est immuable. Modifier le contenu crée une nouvelle version. Une restauration crée aussi une nouvelle version basée sur l’ancienne, sans réécrire les anciens numéros.

Proposition de numérotation : 0.x pour les brouillons, première version approuvée 1.0, augmentation majeure pour un changement de règles ou de périmètre, mineure pour un ajout compatible et correctif pour une correction éditoriale. Le numéro du document reste indépendant de la version de l’application et du SHA Git. Un numéro séquentiel serveur empêche les collisions même si la version lisible est choisie manuellement.

## Cycle et validation

États : brouillon, en revue, approuvée, publiée, remplacée, archivée. Le contenu d’une version soumise est figé ; toute correction crée une nouvelle version et demande une nouvelle revue. La validation enregistre qui a approuvé exactement quelle version et quelle empreinte, à quelle date et avec quel commentaire. L’approbation interne n’est pas présentée comme une signature électronique contractuelle.

La publication est atomique : une seule version publiée courante par document. Publier une nouvelle version marque l’ancienne comme remplacée, en conserve l’accès historique autorisé et met à jour le pointeur. Archiver retire le document des listes actives sans casser les références existantes. Un document financier ou contractuel approuvé ne peut pas disparaître par suppression ordinaire.

## Comparaison et provenance

Le pilote propose historique, résumé des changements et téléchargement des deux versions. La différence textuelle détaillée s’applique d’abord au Markdown ou texte. Pour PDF, Word ou images, ne pas promettre une comparaison sémantique fiable sans traitement supplémentaire. Indiquer les différences non disponibles.

Lorsqu’un document provient de GitHub, conserver repository, chemin, commit SHA, empreinte et version de document. Les documents techniques restent édités dans GitHub ; CELESTE OS présente le commit de référence et, si besoin, son export figé. Les documents métier édités dans CELESTE OS conservent leur historique dans la base et le stockage. L’export vers GitHub est une copie traçable, jamais une synchronisation bidirectionnelle silencieuse.

Pour Notion, Drive, Figma ou tout autre fournisseur, conserver external_provider, external_id, URL, version fournisseur si disponible et date de capture. Un fichier externe susceptible de changer est une référence ; l’app ne garantit une version qu’après capture d’un instantané et de son empreinte.

## Droits et fichiers

Les pièces sont dans un stockage privé. L’accès à la fiche, à la version et au téléchargement vérifie le même périmètre. Une URL de téléchargement expire rapidement ; un lien déjà émis peut rester valable jusqu’à cette expiration, limite à indiquer dans la procédure de révocation. Le partage prestataire est explicitement accordé au document ou à une version figée selon la mission. La publication d’une nouvelle version ne l’élargit pas à d’autres destinataires.

Les fichiers proposés pour le pilote sont PDF, DOCX, XLSX, PPTX, Markdown, PNG et JPEG, avec limite configurable proposée de 20 Mo. Vérifier taille réelle, MIME et signature binaire ; bloquer HTML actif et exécutables. Le fichier reste en quarantaine avant le contrôle prévu. Un téléchargement sert les contenus en pièce jointe si la prévisualisation n’est pas sûre. Aucune pièce confidentielle n’est ajoutée à un dépôt public.

## Fiabilité du téléversement

Le système réserve un objet privé, transfère les octets, contrôle la taille et l’empreinte puis finalise la version. Un transfert interrompu ne publie pas de version vide. Le finaliseur idempotent conserve le résultat. Un nettoyage différé retire les objets orphelins selon un délai documenté. La concurrence sur deux publications se résout par verrou et version attendue, puis message de conflit.

## Gestion de la documentation du projet

Le dossier de cadrage, les CDC, la charte, les schémas et les spécifications peuvent être enregistrés dans le catalogue. Chaque release indique les versions de document et décisions appliquées. Une tâche relie exigence, document de référence et PR. Le moteur IA futur ne peut déclarer un document approuvé ni remplacer une version publiée à partir d’une conversation.

## Exports et portabilité

Un export autorisé contient index JSON, métadonnées, historiques permis, empreintes et fichiers. Il exclut les secrets, liens temporaires, invitations et données hors périmètre. La restauration relie chaque fichier à son identité et sa version ; un rapport signale les pièces manquantes. Les backups incluent les fichiers et la base, car un export SQL seul n’archive pas les octets.
