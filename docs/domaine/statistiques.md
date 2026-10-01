---
paths:
  - 'libs/statistiques/**/*'
---

# Règles métier — contexte `statistiques`

Modèle de lecture séparé : il lit les autres contextes et n'écrit jamais rien
(ADR-0003 R14). C'est la zone la plus riche de la v1 : 16 écrans admin et 8
écrans centre, plus les exports CSV, JSON, PDF et XLSX.

Axes d'analyse de la v1 : synthèse AD47, par centre (synthèse, magasins,
collectes, bénévoles), par magasin, par enseigne, par famille, par bénévoles,
et comparaison annuelle (générale, centres, centres jour par jour, enseignes,
familles).

## RDC-STATS-001 — Une seule règle de calcul de l'évolution N-1 → N

`core` · erreur · ⏳ à implémenter (étape 7)

**Règle.**

| N-1 | N    | Évolution                                    |
| --- | ---- | -------------------------------------------- |
| 0   | 0    | 0 %                                          |
| 0   | > 0  | `null`, affiché « Nouveau »                  |
| > 0 | tout | (N − N-1) / N-1 × 100, arrondi à 2 décimales |

Écrans et exports utilisent tous la même fonction.

**Pourquoi.** Le même chiffre doit apparaître à l'écran, dans le PDF et dans le
XLSX. Afficher un tiret pour 0 → 0 ferait croire à une donnée manquante.

```ts
// ❌ Incorrect : recalcul dans un export
const evolution = n1 ? ((n - n1) / n1) * 100 : 0;

// ✅ Correct
const evolution = Evolution.entre(n1, n);
```

**Vérification en revue.** Aucun autre calcul de variation (rechercher `/ n1`).

**Source v1.** `libs/domain/src/services/comparaison-variation.service.ts:3-23`.

## RDC-STATS-002 — Des lectures découpées par besoin

`pragmatic` · avertissement · ⏳ à implémenter

**Règle.** Chaque écran ou famille d'écrans a sa propre requête de lecture,
avec ses propres types (pas de types Prisma ni d'agrégats). Aucun fichier de
plus de 500 lignes (ADR-0003 R5).

**Pourquoi.** En v1, `global-stats.prisma.query.ts` atteint 3 047 lignes et
concentre la majorité des statistiques ; la comparaison annuelle dispose en
plus de sa propre requête de 847 lignes. Ce sont des points de maintenance et de
lenteur (audit C-06).

**Source v1.**
`apps/api/src/infrastructure/queries/global-stats.prisma.query.ts:1-3047` ;
`apps/api/src/infrastructure/queries/comparaison-annuelle.prisma.query.ts:1-847`,
tailles vérifiées le 2026-10-01.

## RDC-STATS-003 — Le périmètre d'un document est respecté

`core` · erreur · ⏳ à implémenter

**Règle.** Un responsable ne voit que son centre (RDC-ACCES-002). Une synthèse
restreinte à une enseigne **vide** les données qui ne peuvent pas lui être
attribuées (collectes, bénévoles) au lieu de les recopier.

**Pourquoi.** Un document intitulé « Enseigne X » ne doit jamais afficher des
chiffres du réseau entier.

**Source v1.**
`apps/api/src/application/use-cases/stats/restreindre-stats-enseigne.ts:22-83` ;
`apps/api/src/application/use-cases/stats/restreindre-stats-magasin.ts:16-70`.

## RDC-STATS-004 — Les exports neutralisent les formules de tableur

`core` · erreur · ⏳ à implémenter

**Règle.** Dans un export CSV ou XLSX, toute cellule de texte qui commence par
`=`, `+`, `-` ou `@` est préfixée d'une apostrophe. Les exports sont limités en
débit (RDC-ACCES-007).

**Pourquoi.** Un nom saisi comme `=cmd|…` s'exécuterait à l'ouverture dans
Excel (audit A-17).

**Vérification en revue.** Test d'export avec une valeur commençant par `=`.

**Source v1.** Fonctionnalité absente :
`docs/audit/audit-backend-2026-08-01.md:187` (audit A-17).

## RDC-STATS-005 — Ce qui est compté

`core` · erreur · ⚠️ à trancher (D-08)

**Règle.** Les créneaux comptés sont uniquement les PLANIFIE. Les poids sont
lus dans les articles pesés (référence figée, RDC-SAISIE-005). En v1, **toutes
les pesées** sont comptées, validées ou non. À confirmer.

**Source v1.**
`apps/api/src/infrastructure/queries/global-stats.prisma.query.ts:500-540`
(créneaux PLANIFIE) et
`apps/api/src/infrastructure/queries/global-stats.prisma.query.ts:634-684`
(pesées sans filtre de statut).

## RDC-STATS-006 — Le centre crédité d'une pesée doit être cohérent

`core` · erreur · ⚠️ à trancher (D-10)

**Règle.** RDC-SAISIE-006 attribue une pesée au centre gestionnaire de la
participation. La v1 est incohérente jusque dans la même fonction `fetch()` : le
total par centre utilise `ParticipationMagasin.centreId`, mais sa série
journalière utilise `Magasin.centreId`, le rattachement permanent. Les
statistiques dédiées à un centre reviennent à la participation ; la comparaison
annuelle utilise le rattachement permanent. La v2 doit choisir un seul axe et
l'appliquer à tous les écrans et exports.

**Source v1.**
`apps/api/src/infrastructure/queries/global-stats.prisma.query.ts:1040-1072`
(synthèse par participation) ;
`apps/api/src/infrastructure/queries/global-stats.prisma.query.ts:665-684`
(série journalière par magasin) ;
`apps/api/src/infrastructure/queries/global-stats.prisma.query.ts:1836-1853`
(statistiques d'un centre par participation) ;
`apps/api/src/infrastructure/queries/comparaison-annuelle.prisma.query.ts:186-204`.

## Axes temporels observés en v1

L'année d'une collecte vient de `dateDebut`. Elle est calculée à la fois en
TypeScript avec `getFullYear()` et en SQL avec `EXTRACT(YEAR ...)`. Le jour d'une
pesée vient de `SaisieEntry.createdAt`, converti de UTC vers `Europe/Paris` avant
extraction.

**Source v1.**
`apps/api/src/infrastructure/queries/global-stats.prisma.query.ts:309-313` ;
`apps/api/src/infrastructure/queries/comparaison-annuelle.prisma.query.ts:186-228` ;
`apps/api/src/infrastructure/queries/global-stats.prisma.query.ts:634-684`.
