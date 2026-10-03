# ADR-010 — Fichiers privés par périmètre

3 octobre 2026 · Implémenté dans CE-003

## Décision

Les fichiers de travail d'un projet ou d'une mission sont stockés dans le bucket privé `celeste-private`. La table `public.scope_files` conserve le périmètre, le chemin objet, le nom, le type MIME, la taille, l'empreinte SHA-256 et l'état `reserved` ou `ready`. Un objet `ready` est immuable depuis les clients authentifiés.

La lecture reprend exactement `private_celeste.can_read_scope`. Le dépôt est une capacité distincte : les administrateurs actifs peuvent déposer dans leur organisation ; les autres membres doivent avoir un accord actif de lecture portant `file_write = true`. Un prestataire reste limité aux missions. Aucun héritage implicite projet/mission n'est ajouté.

Le navigateur transmet les octets à une Server Action. Celle-ci contrôle nom, limite de 20 Mio, MIME déclaré et signature réelle, calcule SHA-256, réserve la ligne, écrit avec la clé serveur puis finalise. Les clients authentifiés n'ont ni politique `INSERT` sur `storage.objects`, ni droit d'exécuter la finalisation privilégiée. Le secret serveur n'est jamais exposé par une variable publique.

La finalisation verrouille la ligne d'organisation commune aux révocations, relit l'appartenance et la capacité, puis vérifie les métadonnées de l'objet avant de passer à `ready`. Ainsi une révocation concurrente ne peut pas être dépassée par une finalisation tardive. Une réservation vide peut être annulée par son auteur ; un échec serveur supprime l'objet éventuellement créé.

Le téléchargement passe par `/workspace/files/[id]`, relit la session et le droit, puis retourne une URL signée en pièce jointe valable 60 secondes. La connaissance d'un chemin ou d'un UUID ne confère aucun accès.

## Alternatives écartées

- Upload direct par URL signée depuis le navigateur : il contournerait l'inspection des octets et ferait dépendre l'intégrité d'un contrôle client.
- Bucket public : incompatible avec l'isolation organisation/périmètre.
- Déduire l'écriture de la seule lecture : trop large pour les membres et prestataires.
- Autoriser la mutation d'un objet publié/prêt : compromettrait l'audit et la future immutabilité documentaire.

## Conséquences

La clé `SUPABASE_SECRET_KEY` est requise uniquement côté serveur pour les dépôts. La pile CI locale utilise sa clé service_role jetable. Le backend distant en pause n'a reçu ni bucket ni migration ; la migration `20261003160213_private_scope_files` devra être appliquée et vérifiée après résolution de VAL-002. Les justificatifs de dépenses et versions documentaires pourront réutiliser ce socle, mais leurs règles métier restent à construire.
