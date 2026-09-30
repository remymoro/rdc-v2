# RDC v2 — consignes pour les agents de code

Reconstruction de RDC (gestion des collectes des Restos du Cœur) dans un
monorepo Nx 23 (API NestJS 11, TypeScript 6.0, pnpm), en TDD, selon les règles
DDD + architecture hexagonale de Tenets adaptées à NestJS.

L'ancien projet (`../rdc`) sert uniquement de référence fonctionnelle : on
reprend le métier, pas le code.

## Règles d'architecture

- Carte des règles et réflexes essentiels : `docs/architecture/regles/00-index.md`
- Avant de modifier une couche, lire le fichier correspondant :

| Tu modifies…                            | Lis                                                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `libs/*/domain/**`                      | `04-entites-valeurs.md`, `05-agregats-services.md`, `06-creation-reconstitution.md`, `07-repositories.md` |
| `libs/*/application/**`                 | `08-use-cases.md`, `09-unit-of-work.md`, `02-ports.md`                                                    |
| `libs/*/adapters/**`, `apps/api/**`     | `03-adapters-api.md`, `12-erreurs.md`, `09-unit-of-work.md`                                               |
| Un test                                 | `14-tests.md`                                                                                             |
| Un nouveau contexte ou une nouvelle lib | `10-contextes.md`, `15-structure.md`                                                                      |

- Décisions du projet : `docs/adr/` (règles R1 à R15 : ADR-0003).
- Une revue d'architecture cite toujours l'identifiant `TENETS-XXX-NNN` de la règle.

## Non négociable

- Test d'abord : un test rouge, le code minimal, puis le nettoyage.
- `libs/*/domain` et `libs/*/application` : aucun import NestJS, Prisma ou
  Express ; jamais `new Date()` sans argument ni `Date.now()`.
- Un contexte n'importe que lui-même et le `shared-kernel`.
- Toute décision importante ou tout écart à une règle : un ADR.

## Commandes

```bash
pnpm install
pnpm verify                      # lint + test + build de tout le workspace
pnpm nx test referentiel-domain  # un seul projet
pnpm nx affected -t lint test build
pnpm nx format:write
```
