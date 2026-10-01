# Lot A4 — Lire les magasins

- **Branche :** `feat/referentiel-lire-magasins`
- **Prérequis :** A1 fusionné

## Ordre de mission (à coller dans Codex)

```text
Tu travailles dans le dépôt rdc-v2. Lis d'abord AGENTS.md, puis
docs/missions/etape-3-magasins/00-plan.md et
docs/missions/etape-3-magasins/lot-a4-lire-magasins.md : ce dernier est ton
ordre de mission complet. Exécute le lot sur la branche
feat/referentiel-lire-magasins, créée depuis main à jour. Travaille en TDD, un
commit par cycle au format feat(referentiel): …. Termine par
`pnpm agent:gate -- --full`, puis ouvre une pull request titrée
« feat(referentiel): lire les magasins ».
```

## Règles

- Contrat v1 : `GET /api/magasins`, `GET /api/centres/:centreId/magasins`,
  `GET /api/magasins/:id`, réponse `MagasinDto` (mêmes champs et même ordre de
  tri que la v1, à vérifier dans le repository v1).
- Lectures par des requêtes dédiées, pas par le repository d'agrégat
  (TENETS-PORT-002).
- En v1, un responsable ne voit que les magasins de son centre. Ce filtre
  dépend du jeton : il arrive à l'étape 4. Le noter dans la PR, ne pas le
  simuler.

## Cycles TDD

1. Requêtes de lecture et leur fake en mémoire.
2. Use cases de lecture ; `MAGASIN_NOT_FOUND` pour le détail.
3. HTTP et E2E.

## Critères d'acceptation

- [ ] `images: []` tant que le lot C n'est pas fusionné.
- [ ] `pnpm agent:gate -- --full` passe.
