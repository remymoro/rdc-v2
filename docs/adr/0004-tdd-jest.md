# ADR-0004 — TDD, avec Jest pour l'API et les libs

- **Statut :** accepté
- **Date :** 2026-09-30

## Contexte

RDC v2 est développé fonctionnalité par fonctionnalité en TDD, chaque étape
étant vérifiée par la CI. NestJS s'appuie sur les métadonnées de décorateurs
(`emitDecoratorMetadata`) pour l'injection de dépendances.

## Décision

- **Cycle TDD** pour chaque comportement : un test qui échoue, le code minimal
  qui le fait passer, puis le nettoyage. Un seul nouveau test rouge à la fois.
- **Jest** (via `ts-jest`) pour l'API et toutes les libs. Vitest n'est pas
  retenu côté API : esbuild ne génère pas les métadonnées de décorateurs dont
  NestJS a besoin.
- Le futur front Angular pourra utiliser Vitest ; Nx gère deux outils de test
  dans le même workspace.
- Niveaux de tests :
  - `domain` : règles métier, sans aucune infrastructure ;
  - `application` : use cases avec des adapters en mémoire ;
  - `adapters` : tests de contrat, rejoués contre PostgreSQL (R10) ;
  - `api-e2e` : parcours HTTP boîte noire.
- **Un niveau de test ne compte que s'il tourne en CI.** Dès qu'un niveau
  contient un premier test, la CI l'exécute (cible Nx dédiée si besoin :
  `test-integration`, `e2e`, avec un service PostgreSQL). Un test qui n'est
  lancé qu'en local n'est pas une garantie.
- **Chaque niveau arrive avec le code qu'il vérifie**, pas avant : l'état de la
  pyramide et l'étape où chaque niveau est ajouté sont suivis dans
  `docs/roadmap.md`.

## Conséquences

- Une PR sans test pour un nouveau comportement est refusée en relecture.
- Les tests du domaine tournent en CI (contrairement à RDC v1).
