# RDC v2 — Gestion des collectes des Restos du Cœur

Reconstruction de RDC en monorepo **Nx 23**, API **NestJS 11**, **TypeScript 6.0**,
développée en **TDD** selon les règles **DDD + architecture hexagonale** de Tenets.

## Démarrer

```bash
nvm use            # Node 24 (.nvmrc)
corepack enable    # pnpm à la version fixée dans package.json
pnpm install
pnpm verify        # lint + tests + build
pnpm nx serve api  # http://localhost:3000/api
```

## Structure

```text
apps/api                      composition root NestJS
apps/api-e2e                  tests HTTP boîte noire
libs/referentiel/domain       domaine pur du contexte Référentiel
libs/referentiel/application  use cases et ports du contexte Référentiel
docs/adr/                     décisions d'architecture
```

## Décisions

Voir [`docs/adr/`](docs/adr/) — en particulier les
[règles d'architecture R1 à R15](docs/adr/0003-regles-architecture.md).

## CI

`.github/workflows/ci.yml` : formatage, lint (architecture comprise), tests et
build des projets touchés, audit de sécurité. Une branche n'est fusionnée sur
`main` que si la CI est verte.
