# Historique des validations CELESTE OS

Steve autorise depuis le 2 octobre 2026 les demandes de validation par email et leur historique GitHub. Les corrections réversibles déjà autorisées continuent sans demande de permission générale.

## Demande concrète

Créer une issue avec ID VAL séquentiel, question précise, résultat ou version à examiner, recommandation, options et effet sur les tâches. Ajouter la demande dans requests.jsonl. États : pending, approved, rejected, needs_clarification, superseded, cancelled.

## Envoi

Destinataire Steve seul, vérifié via son profil Gmail connecté. Avant envoi, contrôler qu’aucun message n’a déjà été envoyé pour cet ID et cette version. Sujet [CELESTE OS][VAL-nnn], résumé, question et lien de l’issue. Ajouter dans events.jsonl message ID, thread ID si disponible et date. Ne pas commiter l’adresse complète ni du contenu privé inutile.

Si un envoi a une issue incertaine, rechercher le message par ID ou sujet exact avant de réessayer. Un brouillon ne prouve pas un envoi.

## Réponse et provenance

Une réponse GitHub provient du compte Steve-Landry-NONO ; une réponse Gmail provient du profil vérifié et vise cette demande et version. Lire réellement la réponse. Ajouter un événement daté avec décision, source et référence, puis un commentaire d’issue. Une réponse ambiguë reste needs_clarification. Une réponse dans ce chat porte source chat, date et contexte exact, sans inventer un ID ou URL.

Une review ou un commentaire peut établir une décision. Un merge technique ne valide pas automatiquement une nouvelle règle financière. Aucun silence n’est un accord.

## Historique et reprise

Ne pas réécrire un événement passé ; une correction ajoute un événement qui le remplace avec raison. L’état courant est dérivé des événements vérifiés. Les emails sont recherchés uniquement pour les demandes déjà envoyées par sujet ou thread précis. Ne pas copier des conversations étrangères au projet. Une validation en attente bloque uniquement les travaux dépendants, les autres avancent.

## Exclusion des messages de l’agent

Un email envoyé à Steve depuis son propre compte peut aussi apparaître dans sa boîte reçue. Les message_id des événements email_sent, les demandes et commentaires écrits par l’agent, et leur texte cité ne constituent jamais une réponse de Steve. Exclure ces messages avant interprétation ; exiger une réponse nouvelle et explicite sur la version concernée. Le seul nom du compte auteur ne suffit pas.
