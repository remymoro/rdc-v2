# ADR-0001 — Socle technique : Nx 23, NestJS 11, TypeScript 6.0, Node 24

- **Statut :** accepté
- **Date :** 2026-09-30

## Contexte

RDC v2 est reconstruit de zéro dans un monorepo Nx. L'API NestJS arrive en
premier ; le front Angular sera ajouté plus tard dans le même workspace. Toutes
les applications d'un monorepo partagent une seule version de TypeScript : les
versions doivent donc être compatibles avec l'Angular visé, dès maintenant.

## Décision

| Outil               | Version                   | Raison                                                                                                              |
| ------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Nx                  | 23.2.x                    | Angular 22.1 exige Nx ≥ 23.2.0                                                                                      |
| NestJS              | 11.x                      | `@nx/nest` 23 ne prend en charge que NestJS 10 et 11 ; **ne pas passer à NestJS 12** tant que Nx ne le supporte pas |
| TypeScript          | `~6.0.x`                  | Angular 22 exige `>=6.0.0 <6.1.0` ; ne pas utiliser `^` ni TypeScript 7                                             |
| Node.js             | 24 (`.nvmrc`)             | Compatible Angular 22 et NestJS 11                                                                                  |
| Angular (plus tard) | 22.1.x                    | —                                                                                                                   |
| ESLint              | 9, configuration « flat » | Nx 23.1 ne supporte plus ESLint 8                                                                                   |

TypeScript est en mode `strict` dans tout le workspace (`tsconfig.base.json`).

Compatibilité NestJS 11 + TypeScript 6.0 vérifiée le 2026-09-30 sur le
squelette généré par Nx (lint, tests et build passent). À revérifier après le
passage de `tsconfig.base.json` en mode `strict` : `pnpm verify`.

## Conséquences

- Avant d'ajouter Angular 22, passer Node à ≥ 24.15.0 (exigence d'Angular 22)
  et relever `engines.node` dans `package.json`.
- Montées de version : uniquement via `pnpm nx migrate latest`, jamais à la
  main, pour que Nx applique ses migrations de code.
- Solution de repli éprouvée si une incompatibilité apparaît : Nx 22.7 +
  Angular 21 + TypeScript 5.9 + NestJS 11 (combinaison de RDC v1 en production).
