# Modèle de données de CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Conventions

UUID pour les identités, organisation obligatoire sur les tables métier, dates UTC pour les événements et dates civiles pour dépenses et échéances. Les lignes éditables portent created_at, updated_at, created_by et row_version. Les écritures confirmées portent confirmed_at et confirmed_by et deviennent immuables hors opérations de correction dédiées. Les relations enfant parent incluent le contrôle de l’organisation pour éviter de rattacher une tâche d’une organisation au projet d’une autre.

## Entités et attributs essentiels

| Entité | Attributs ou relations essentielles | Contrainte |
|---|---|---|
| organizations | name, timezone, base_currency | Aucune organisation codée en dur |
| profiles | auth_user_id, display_name, locale | Un profil par utilisateur Auth |
| memberships | organization_id, user_id, role_id, status | Unique organisation et utilisateur |
| roles et role_permissions | code, capability | Configuration serveur, pas metadata client |
| scope_grants | membership_id, resource_type, resource_id, capability, expires_at | Borne explicite, refus par défaut |
| spaces | organization_id, title | Périmètre organisation |
| projects | space_id, owner_id, status | Responsable membre actif |
| project_members | project_id, membership_id, permissions | Pas de membres d’autre organisation |
| phases et milestones | project_id, dates, status | Phase appartenant au projet |
| tasks | project_id, phase_id, assignee_id, due_date, status, priority | Un responsable unique |
| meetings | project_id, starts_at, ends_at, timezone | Fin après début |
| meeting_participants | meeting_id, membership_id | Accès explicitement autorisé |
| decisions | meeting_id, text, owner_id, linked_task_id | Décision reliée à ses actions |
| vendors | name, contact, organization_id | Données privées |
| missions | vendor_id, project_id, scope | Point d’entrée d’accès prestataire |
| mission_members et mission_resources | mission_id, membership_id ou resource_id | Partage explicite |
| deliverables | mission_id, document_version_id, status, due_date | Validation sur version figée |
| payment_milestones | mission_id, amount_minor, currency, due_date, status | Engagement distinct d’un paiement |
| expense_categories | parent_id, title, active | Unique normalisé par parent, pas de cycle |
| expenses | amount_minor, currency, spent_on, source_type, payer_id, account_id, treatment, category_id, project_id, phase_id, status | Source personnelle ou fonds exclusive |
| expense_attachments | expense_id, private_object_key, checksum | Fichier non public |
| contribution_periods | founder_set, method, target_minor, effective_dates, status | Référence dynamique ou fixée, clôture figée |
| contribution_entries | period_id, founder_id, signed_amount_minor, kind, expense_id ou deposit_id, reversal_of | Une projection par source, pas double saisie |
| cash_accounts | name, currency, organization_id | Solde calculé depuis mouvements |
| fund_deposits | founder_id, account_id, amount_minor, reference, status | Contribution et caisse liées |
| cash_entries | account_id, signed_amount_minor, source_type, source_id, reversal_of | Unique par effet source |
| reimbursement_policies | effective_from, scope, reserve_minor, equality_tolerance_minor, approved_by | Version de politique conservée |
| reimbursement_claims | expense_id, beneficiary_id, amount_minor, policy_id, status | Traitement remboursable obligatoire |
| reimbursement_payments | claim_id, account_id, amount_minor, paid_at, reference | Somme inférieure ou égale à dette |
| supplier_refunds | expense_id, amount_minor, destination, received_at, status | Effets selon destination réelle |
| documents | code, title, type, owner_id, scope, published_version_id | Identité stable |
| document_versions | document_id, sequence, label, previous_version_id, checksum, object_key, status, change_summary, origin | Unique document et séquence, contenu figé |
| document_approvals | version_id, approver_id, result, comment, checksum | Approbation liée au contenu |
| document_links | document_id ou version_id, resource_type, resource_id | Version explicite pour livrable |
| upload_reservations | document_id, object_key, expires_at, status | Finalisation avant publication |
| activity_events | actor_id, scope, action, resource_id, occurred_at | Append-only serveur |
| notifications | recipient_id, event_id, read_at | Pas de compteur hors droits |
| idempotency_keys | organization_id, actor_id, command, key, payload_hash, result | Unicité atomique |
| outbox_events | event_key, payload, state, retry_at | Événement lié au commit métier |
| integration_connections | provider, scopes, status, secret_reference | Aucun token exposé au client |
| external_mappings | provider, external_id, local_type, local_id, version | Unique connexion et objet externe |

## Règles de cohérence

Une dépense personnelle exige payer_id et interdit account_id. Une dépense fonds exige account_id et ne génère pas de contribution individuelle. treatment vaut contribution, reimbursable ou fund_expense selon la source. Une demande de remboursement ne peut référencer une contribution. Les projections contribution_entries et cash_entries sont exclusivement générées par les commandes serveur ; elles ne sont pas des formulaires modifiables indépendamment.

Un paiement de jalon prestataire référence une dépense existante ou en crée une dans la même transaction. Une contrainte empêche de compter à la fois le paiement et la dépense liée comme deux coûts. Une dépense fractionnée se représente par paiements effectifs distincts reliés à un engagement unique, sans modifier le montant contractuel en paiement réel.

Le document possède une version publiée courante ou aucune ; le serveur vérifie que cette version appartient au même document et organisation. Les changements de statut, approbations et pointeur sont atomiques. Les objets stockage utilisent des chemins d’organisation et document mais ces chemins ne remplacent pas les autorisations.

## Index et consultation

Index sur organisation et état, organisation et échéance, responsable et statut, projet et phase, source de contribution, compte et date, document et séquence, notification et destinataire. Pagination pour tâches, dépenses, documents et activité. Les totaux portent devise, période, filtres appliqués et date du calcul. Les vues SQL exposées respectent RLS ou sont inaccessibles au client et servies via API autorisée.

## Migration et données de départ

Créer organisations et rôles en environnement de test, puis deux organisations fictives, trois fondateurs de test et deux prestataires. Les fondateurs réels sont invités avec identités vérifiées lors de l’ouverture du pilote. Les catégories par défaut sont des propositions désactivables. Les montants réels commencent à zéro ou à reconstituer. Aucune migration SQL n’a été appliquée dans cette livraison.

## Extensions prévues

Commentaires et messages rattachés à une ressource autorisée ; budgets et allocations ; taxonomies d’inspiration ; tokens de notification ; historiques de synchronisation ; sessions IA, provenance et propositions. Chaque extension reçoit une migration, une politique d’accès et des tests propres avant exposition.
