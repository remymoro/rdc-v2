# ADR-0012 — Agent Gate local en deux niveaux

- **Statut :** accepté
- **Date :** 2026-10-01

## Contexte

La CI vérifie le code après publication d'une branche, mais un agent doit pouvoir
obtenir le même verdict avant de proposer son travail. Les contrôles rapides ne
doivent pas imposer PostgreSQL à chaque cycle TDD ; les validations
d'infrastructure restent néanmoins obligatoires avant fusion lorsqu'elles sont
concernées.

## Décision

1. `pnpm agent:gate` est le point d'entrée local unique : politique du dépôt,
   formatage, lint, tests unitaires et build.
2. `pnpm agent:gate -- --full` ajoute migrations Prisma, tests d'intégration et
   tests E2E. PostgreSQL doit déjà être disponible ; le gate ne démarre ni ne
   modifie implicitement l'infrastructure locale.
3. La politique refuse le travail direct sur `main`, un nom de branche hors
   convention, la documentation agent essentielle absente ou non versionnée et
   les fichiers de sauvegarde parasites. Les types acceptés sont ceux de
   l'ADR-0010 : `feat`, `fix`, `docs`, `chore`, `refactor` et `test`.
4. Le verdict automatisé ne prétend pas prouver la chronologie TDD ni la
   pertinence d'une revue. Le gate rappelle donc les contrôles humains : cycle
   rouge-vert-nettoyage, règles `TENETS-XXX-NNN` et `RDC-XXX-NNN`, documentation
   et ADR.
5. Les fonctions de politique et de composition des étapes sont testées sans
   lancer de sous-processus. Ces tests font partie de `pnpm verify`.
6. Le gate désactive le daemon et l'isolation des plugins Nx pour éviter les
   sockets Unix refusés dans certains environnements d'agents sandboxés.

## Conséquences

- Un agent reçoit un verdict rapide avant d'ouvrir ou de mettre à jour sa pull
  request.
- Le mode complet reste explicite et reproductible avec la CI.
- Le gate signale une documentation non versionnée ; il ne crée aucun commit et
  ne corrige jamais automatiquement l'arbre Git.
