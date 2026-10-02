# RDC v2 — Gestion des collectes des Restos du Cœur

Reconstruction de RDC en monorepo **Nx 23**, API **NestJS 11**, **TypeScript 6.0**,
développée en **TDD** selon les règles **DDD + architecture hexagonale** de Tenets.

## Démarrer

```bash
nvm use            # Node 24 (.nvmrc)
corepack enable    # pnpm à la version fixée dans package.json
pnpm install
cp .env.example .env
docker compose up -d postgres    # PostgreSQL 16 (bases rdc et rdc_test)
pnpm prisma generate             # client Prisma (non versionné)
pnpm prisma migrate deploy       # migrations v1 + v2
pnpm verify                      # lint + typecheck + tests + build
pnpm nx run-many -t test-integration   # tests sur PostgreSQL
pnpm e2e                         # tests E2E HTTP (base rdc_test)
pnpm nx serve api  # http://localhost:3000/api
```

## Agent Gate

Avant de proposer une pull request, un agent exécute :

```bash
pnpm agent:gate
```

Le contrôle vérifie la politique Git et documentaire, puis le formatage, le
lint, les tests et le build. Avant fusion d'une évolution qui touche la
persistance ou HTTP, PostgreSQL étant démarré :

```bash
pnpm agent:gate -- --full
```

Le mode complet ajoute les migrations Prisma, les tests d'intégration et les
tests E2E. La décision est documentée dans
[`ADR-0012`](docs/adr/0012-agent-gate.md).

## Structure

```text
apps/api                      composition root NestJS
apps/api-e2e                  tests HTTP boîte noire
apps/web                      front Angular 22 (Tailwind, Vitest), HTTP uniquement
libs/referentiel/domain       domaine pur du contexte Référentiel (centres, magasins, produits)
libs/referentiel/application  use cases, requêtes de lecture et ports du contexte Référentiel
libs/referentiel/adapters     HTTP, Prisma et module NestJS du contexte Référentiel
libs/shared-kernel            ports techniques communs (UnitOfWork, Clock) et leurs adapters
docs/roadmap.md               avancement : commencer par là
docs/domaine/                 règles métier RDC-XXX-NNN et glossaire
docs/architecture/regles/     règles d'architecture TENETS-XXX-NNN
docs/adr/                     décisions d'architecture
```

## Décisions

Voir [`docs/adr/`](docs/adr/) — en particulier les
[règles d'architecture R1 à R15](docs/adr/0003-regles-architecture.md).

## CI

`.github/workflows/ci.yml` : formatage, lint (architecture comprise), tests et
build des projets touchés, audit de sécurité. Une branche n'est fusionnée sur
`main` que si la CI est verte.
