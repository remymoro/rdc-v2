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

**Source v1.** `libs/domain/src/services/comparaison-variation.service.ts`.

## RDC-STATS-002 — Des lectures découpées par besoin

`pragmatic` · avertissement · ⏳ à implémenter

**Règle.** Chaque écran ou famille d'écrans a sa propre requête de lecture,
avec ses propres types (pas de types Prisma ni d'agrégats). Aucun fichier de
plus de 500 lignes (ADR-0003 R5).

**Pourquoi.** En v1, une seule requête de 2 954 lignes porte toutes les
statistiques (audit C-06) : c'est un point unique de maintenance et de lenteur.

**Source v1.** `infrastructure/queries/global-stats.prisma.query.ts`.

## RDC-STATS-003 — Le périmètre d'un document est respecté

`core` · erreur · ⏳ à implémenter

**Règle.** Un responsable ne voit que son centre (RDC-ACCES-002). Une synthèse
restreinte à une enseigne **vide** les données qui ne peuvent pas lui être
attribuées (collectes, bénévoles) au lieu de les recopier.

**Pourquoi.** Un document intitulé « Enseigne X » ne doit jamais afficher des
chiffres du réseau entier.

**Source v1.** `use-cases/stats/restreindre-stats-enseigne.ts`, `restreindre-stats-magasin.ts`.

## RDC-STATS-004 — Les exports neutralisent les formules de tableur

`core` · erreur · ⏳ à implémenter

**Règle.** Dans un export CSV ou XLSX, toute cellule de texte qui commence par
`=`, `+`, `-` ou `@` est préfixée d'une apostrophe. Les exports sont limités en
débit (RDC-ACCES-007).

**Pourquoi.** Un nom saisi comme `=cmd|…` s'exécuterait à l'ouverture dans
Excel (audit A-17).

**Vérification en revue.** Test d'export avec une valeur commençant par `=`.

## RDC-STATS-005 — Ce qui est compté

`core` · erreur · ⚠️ à trancher (D-08)

**Règle.** Les créneaux comptés sont uniquement les PLANIFIE. Les poids sont
lus dans les articles pesés (référence figée, RDC-SAISIE-005). En v1, **toutes
les pesées** sont comptées, validées ou non. À confirmer.

**Source v1.** `global-stats.prisma.query.ts` (filtre `statut = 'PLANIFIE'` sur les créneaux, aucun filtre sur les pesées).
