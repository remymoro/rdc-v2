# Lot B — Catalogue des produits

- **Branche :** `feat/referentiel-produits`
- **Prérequis :** aucun (indépendant des lots A)

## Ordre de mission (à coller dans Codex)

```text
Tu travailles dans le dépôt rdc-v2. Lis d'abord AGENTS.md, puis
docs/missions/etape-3-magasins/00-plan.md et
docs/missions/etape-3-magasins/lot-b-produits.md : ce dernier est ton ordre de
mission complet. Exécute le lot sur la branche feat/referentiel-produits, créée
depuis main à jour. Travaille en TDD, un commit par cycle au format
feat(referentiel): …. Termine par `pnpm agent:gate -- --full`, puis ouvre une
pull request titrée « feat(referentiel): catalogue des produits ».
```

## Règles

- RDC-REF-008 : code `D` + 6 chiffres à la création, famille et sous-famille
  non vides, indicateur actif. On désactive, on ne supprime pas.
- La reconstitution accepte les anciens formats de code (données historiques
  importées) : choix assumé de la v1, à conserver
  (`../rdc/libs/domain/src/produit/produit.entity.ts:49-57`).
- Contrat v1 : `POST /api/produits` (201), `GET /api/produits`,
  `PATCH /api/produits/:id`, `PATCH /api/produits/:id/{activer,desactiver}`.
  Reprendre corps, réponses et codes de
  `../rdc/apps/api/src/presentation/http/controllers/produit.controller.ts` et
  de ses DTO.
- La référence d'une pesée reste libre (D-11) : le catalogue n'est pas
  consulté par la saisie à ce stade.

## Cycles TDD

1. `ProduitId`, `CodeProduit` (création stricte, reconstitution tolérante),
   `Famille`, `SousFamille`.
2. `Produit.creer`, `reconstituer`, `modifier`, `activer`, `desactiver`
   (sans effet si déjà dans l'état).
3. Repository, suite de contrat, fake, Prisma sur la table `Produit` v1.
4. Use cases, HTTP, E2E.

## Critères d'acceptation

- [ ] RDC-REF-008 passe à ✅.
- [ ] `pnpm agent:gate -- --full` passe.
