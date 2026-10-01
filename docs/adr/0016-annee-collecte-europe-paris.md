# ADR-0016 — L'année d'une collecte est l'année civile Europe/Paris de sa date de début

- **Statut :** accepté
- **Date :** 2026-10-01
- **Décision métier :** D-12 (`docs/domaine/a-trancher.md`)

## Contexte

RDC-COLLECTE-022 n'autorise qu'une collecte par année, et les statistiques
comparent l'année N à l'année N-1 pour justifier les demandes de fonds. La v1
calcule cette année de deux façons différentes :

- les use cases utilisent `dateDebut.getFullYear()`, donc le fuseau du
  processus Node (`../rdc/apps/api/src/application/use-cases/collecte/creer-collecte.usecase.ts:24-33`) ;
- le repository cherche les collectes entre deux bornes construites avec
  `Date.UTC` (`../rdc/apps/api/src/infrastructure/repositories/collecte.prisma.repository.ts:145-157`).

Une collecte qui commence le 1er janvier à 0 h 30, heure de Paris, est le
31 décembre en UTC : elle peut être rangée dans deux années différentes selon
le chemin de code.

## Décision

1. L'année d'une collecte est l'**année civile Europe/Paris** de sa date de
   début.
2. Une seule fonction du domaine calcule cette année. Elle sert à l'unicité
   annuelle (RDC-COLLECTE-022) et aux statistiques N/N-1.
3. Les bornes d'une année en base sont le 1er janvier à 0 h, heure de Paris,
   converties en UTC (changement d'heure compris), et non `Date.UTC`.
4. Le fuseau est une constante du domaine, pas une variable d'environnement :
   il ne dépend ni du serveur (NAS, poste de développement, CI) ni de sa
   configuration.

## Conséquences

- Écart volontaire à la v1, dont le repository raisonne en UTC.
- Les collectes v1 ont lieu en mars : aucune n'est concernée par la frontière
  du 1er janvier. La reprise des données n'a rien à recalculer, l'année n'étant
  pas stockée.
- Le lot 2 de `verification-magasins` teste la frontière : début le 1er janvier
  à 0 h 30 heure de Paris (31 décembre en UTC) → année du 1er janvier.
