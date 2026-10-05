# Règles financières de CELESTE OS

Version 0.1.0 · 2 octobre 2026 · Statut proposé pour revue · Responsable de validation Steve

## Cadre retenu

La finance suit les coûts réellement payés, les contributions économiques des fondateurs et la trésorerie commune. Ces trois grandeurs restent distinctes. Les dépenses personnelles initiales sont retenues comme contributions et ne créent aucune dette de remboursement. Le remboursement reste prévu pour un régime futur explicite. Les apports suivis ici ne modifient pas automatiquement les pourcentages de parts juridiques.

Le calcul initial compare les contributions nettes acceptées des fondateurs actifs dans la même période d’équilibrage et la même devise. La référence dynamique est la contribution maximale. Un objectif fixé collectivement peut remplacer cette référence avec décision datée, version et périmètre. La clôture d’une période fige un instantané ; une nouvelle opération crée un nouveau calcul sans modifier la clôture précédente.

## Règles identifiées

| ID | Règle |
|---|---|
| FIN-R01 | Montants en unités mineures entières, jamais en flottants ; euro en centimes pour le pilote |
| FIN-R02 | Une dépense personnelle confirmée en mode contribution augmente le coût et la contribution du payeur, sans mouvement dans la caisse |
| FIN-R03 | Un versement au fonds augmente la contribution du fondateur et la caisse, sans augmenter les coûts |
| FIN-R04 | Une dépense payée par le fonds augmente le coût et réduit la caisse, sans augmenter une contribution individuelle |
| FIN-R05 | Un engagement non payé n’augmente ni coût payé ni contribution ; il figure séparément dans le prévisionnel |
| FIN-R06 | Une demande de remboursement ne peut porter sur une dépense déjà retenue comme contribution |
| FIN-R07 | Un paiement de remboursement réduit la caisse et la dette remboursable, sans créer une seconde dépense ni contribution |
| FIN-R08 | Une correction après confirmation produit une contre-écriture et un nouvel enregistrement lié, sans effacer l’historique |
| FIN-R09 | Une même clé d’idempotence et même payload donnent le même résultat ; réutiliser la clé avec un autre payload produit un conflit |
| FIN-R10 | Montants en attente, devises différentes et travail non monétaire ne sont pas agrégés implicitement |

## Calcul des contributions

Pour chaque fondateur, la contribution nette retenue correspond aux dépenses personnelles confirmées en mode contribution, plus les versements confirmés au fonds et les autres apports financiers expressément admis, moins les retours d’apports et annulations applicables. Les apports non monétaires restent descriptifs tant qu’une méthode de valorisation n’est pas approuvée.

Le reste à apporter est la différence positive entre la référence de la période et la contribution nette. Aucun reste négatif ne crée automatiquement un remboursement. Si un fondateur quitte le périmètre ou si les règles changent, une décision de période conserve le calcul précédent et explicite le nouveau.

## Exemple de recette fictif

Ces nombres sont des données de test et ne décrivent pas les finances réelles de CELESTE.

| Opération | Coût payé cumulé | Caisse | Contribution Maeva | Contribution Steve | Contribution Stéphane |
|---|---:|---:|---:|---:|---:|
| Maeva paie personnellement 1 200 euros | 1 200 | 0 | 1 200 | 0 | 0 |
| Steve paie personnellement 300 euros | 1 500 | 0 | 1 200 | 300 | 0 |
| Stéphane paie personnellement 100 euros | 1 600 | 0 | 1 200 | 300 | 100 |
| Steve verse 900 euros dans le fonds | 1 600 | 900 | 1 200 | 1 200 | 100 |
| Stéphane verse 1 100 euros dans le fonds | 1 600 | 2 000 | 1 200 | 1 200 | 1 200 |
| Le fonds paie le designer 500 euros | 2 100 | 1 500 | 1 200 | 1 200 | 1 200 |

Après la troisième opération, Steve doit encore apporter 900 euros et Stéphane 1 100 euros pour atteindre la référence de 1 200 euros. Après les versements, les contributions sont égales. Le paiement du designer ne casse pas cette égalité. Les contributions totales de 3 600 euros correspondent alors aux coûts de 2 100 euros plus la caisse de 1 500 euros, dans cet exemple sans recettes ni autres flux.

## Régime de remboursements futurs

Pour le pilote, cet état est persisté par organisation dans une politique versionnée strictement `disabled`. La ligne est immuable et aucune commande de demande, activation ou paiement n’est exposée. Une activation future exige une nouvelle décision explicite et une migration revue ; elle ne peut pas être obtenue par un réglage client ou une mise à jour silencieuse.

Le régime démarre désactivé pour les fondateurs. Son activation nécessite une décision datée des fondateurs habilités, une période d’équilibrage identifiée, l’égalité constatée et un seuil de réserve de caisse défini. La tolérance d’égalité proposée est zéro centime pour le pilote. Le seuil « assez dans la caisse » ne peut être inventé : il reste un paramètre à décider avant activation.

L’activation établit la date d’effet, les bénéficiaires, les dépenses éligibles, les approbateurs et le seuil de réserve. Une nouvelle dépense personnelle éligible peut prendre le traitement « avance remboursable » : elle augmente les coûts et la dette envers le payeur, mais ne modifie pas sa contribution. Cette règle maintient l’égalité initiale.

États d’une demande : brouillon, soumise, approuvée, partiellement payée, payée, refusée, annulée. Une demande référence une dépense confirmée et les pièces. L’approbateur doit être un autre membre habilité que le bénéficiaire, proposition de contrôle à confirmer. À chaque paiement, le système contrôle la dette restante, la caisse réellement disponible après engagements protégés et la réserve. Il conserve les paiements partiels et la référence bancaire. Une approbation n’est jamais considérée comme un paiement.

Si un fondateur souhaite rembourser une ancienne contribution, la simple activation du régime futur ne suffit pas. Il faut une requalification explicite approuvée : contre-écriture de contribution, création de dette, nouvel écart d’égalisation et trace de la décision. Aucune dépense historique n’est automatiquement convertie.

## Retours et annulations

Un fournisseur rembourse une dépense payée par le fonds : la caisse augmente et le coût net diminue. Si une dépense de contribution est remboursée personnellement au fondateur, coût et contribution diminuent. Si le remboursement d’une dépense personnelle arrive dans le fonds, la contribution initiale est annulée à hauteur du remboursement et un versement au fonds lié est enregistré pour le fondateur ; l’effet net sur sa contribution reste identique, le coût baisse et la caisse augmente.

Une dépense remboursable payée à la personne puis remboursée par le fournisseur impose une régularisation de dette et/ou un retour à la caisse selon le destinataire réel. Les liens entre dépense, remboursement fournisseur et règlement évitent une dette négative. Les corrections sont transactionnelles et soumises à revue finance.

## Coûts par catégorie et phase

Une dépense a une catégorie et, si besoin, une sous-catégorie. Le pilote ne répartit pas une même dépense sur plusieurs lignes analytiques. Une répartition future exigera des allocations dont la somme égale exactement le montant, afin d’éviter les doubles comptes. Les axes catégorie, projet et phase sont indépendants : « prestataire » est aussi un tiers, pas nécessairement une catégorie.

Le coût payé de développement résulte des dépenses confirmées liées à la phase concernée, nettes des avoirs confirmés. Il ne comprend ni versements au fonds, ni remboursement d’une dépense déjà comptée, ni estimation de travail. Le prévisionnel affiche séparément budget, engagements et coûts payés.

## Politique de contrôle

Une écriture confirmée n’est pas supprimable depuis le client. Les brouillons peuvent être retirés. Les écritures de caisse se réconcilient avec un relevé et un solde initial justifié. Un solde initial n’est pas un apport fictif. Toutes les opérations dérivées se font dans une transaction serveur, avec clé d’idempotence, devise cohérente, autorisation et journal.

La conversion multidevise est différée : conserver la devise d’origine, date et source du taux et montant de base arrondi lorsque la règle sera approuvée. Sans cette règle, afficher des totaux séparés par devise.
