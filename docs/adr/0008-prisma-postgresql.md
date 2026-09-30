# ADR-0008 — Prisma 7 et PostgreSQL : schéma v1 repris, clé de doublon en base

- **Statut :** accepté
- **Date :** 2026-09-30

## Contexte

RDC v2 doit persister les agrégats du domaine. RDC v1 utilise PostgreSQL 16
et Prisma 7 (16 modèles, 32 migrations) et sa base de production contient les
données réelles. En v1, l'unicité d'un centre porte sur les valeurs brutes
(`@@unique([nom, ville, codePostal, adresse])`) alors que la règle métier
compare une clé normalisée : deux créations simultanées du même centre écrit
différemment ne sont pas bloquées.

## Décision

1. **Schéma et migrations de la v1 repris tels quels** (commit `c9734f4` de
   RDC v1) comme point de départ dans `prisma/`. La base de production v1 reste
   utilisable par la v2 sans migration de données. Les migrations v2 s'ajoutent
   à la suite.
2. **Clé de doublon stockée en base** : colonne `Centre.cleDoublon` unique,
   calculée par `CleDoublonCentre` à chaque enregistrement. Recherche directe
   (`existsByCleDoublon`) et protection contre les créations simultanées.
   La colonne est facultative tant que les centres repris de la v1 n'ont pas été
   recalculés.
3. **Organisation** :
   - `prisma/schema.prisma`, `prisma/migrations/`, `prisma.config.ts` à la racine
     (une base pour tous les contextes) ;
   - client généré dans `libs/shared-kernel/adapters/src/prisma/generated`
     (non versionné, format CommonJS pour Jest) ;
   - `PrismaTransaction` et la fabrique du client dans `shared-kernel/adapters` ;
     un repository par contexte dans `libs/<contexte>/adapters`.
4. **Versions** : Prisma `~7.10.0` pour le CLI **et** le client. Le tag `latest`
   de `prisma` pointe sur une 8.0.0-rc : ne jamais installer sans version.
5. **Tests** : PostgreSQL 16 via `docker-compose.yml` en local (bases `rdc` et
   `rdc_test`), service PostgreSQL en CI. Les tests `*.integration.spec.ts`
   tournent via la cible `test-integration`, séparée de `test`. Chaque
   repository Prisma passe la même suite de contrat que son fake (R10).
6. **Sécurité** : `pnpm.overrides` force `mysql2 >= 3.23.1` et
   `deepmerge-ts ^8`, dépendances transitives vulnérables du CLI Prisma
   (installé en production comme dépendance paire de `@prisma/client`).
   Vérifié : génération, migrations et tests fonctionnent.

## Conséquences

- **Avant la mise en production** : un script de reprise calcule `cleDoublon`
  pour les centres existants, signale les doublons déjà présents en v1, puis une
  migration rend la colonne obligatoire.
- `prisma migrate dev` étant interactif, une migration se crée avec
  `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`
  dans un dossier `AAAAMMJJHHMMSS_nom/migration.sql`.
- La CI applique toutes les migrations sur une base vierge à chaque exécution.
- Retirer les `overrides` dès qu'une version de Prisma corrige ces dépendances.
