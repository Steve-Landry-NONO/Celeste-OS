# Écritures financières de CELESTE OS

ID ADR-002 · 2 octobre 2026 · Statut proposé

Les commandes serveur créent les effets sur coûts, contributions et caisse dans une transaction. Les écritures dérivées ne se saisissent pas indépendamment. Les sources portent une unicité et une clé d’idempotence avec empreinte du payload. Une correction conserve l’ancienne écriture et crée une contre-écriture.

Une alternative avec totaux calculés et modifiés dans le client a été écartée car elle permet doubles soumissions, permissions contournées et effets partiels. Le coût de cette décision est la nécessité de tests du domaine, SQL et API concurrents avant utilisation réelle. Les règles fonctionnelles restent celles de docs/04_FINANCE.md.
