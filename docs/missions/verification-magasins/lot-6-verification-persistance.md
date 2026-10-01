# Lot 6 — Persistance Prisma de la vérification

- **Branche :** `feat/collecte-verification-persistance`
- **Prérequis :** lot 5 fusionné

## Ordre de mission (à coller dans Codex)

```text
Tu travailles dans le dépôt rdc-v2. Lis d'abord AGENTS.md, puis
docs/missions/verification-magasins/00-plan.md et
docs/missions/verification-magasins/lot-6-verification-persistance.md : ce dernier est ton ordre de mission
complet. Exécute le lot sur la branche feat/collecte-verification-persistance, créée depuis main à jour.
Travaille en TDD : un test rouge, le code minimal, le nettoyage, un commit par
cycle, dans l'ordre des cycles du brief. Termine par `pnpm agent:gate -- --full`, puis
ouvre une pull request dont la description cite les règles RDC-… et TENETS-…
appliquées, les cycles réalisés et la section « Hors périmètre ».
```

## Objectif

Stocker listes et réponses selon le modèle du design doc, avec des migrations
additives sur le schéma v1 (ADR-0008).

## Cycles TDD (dans l'ordre)

1. Migration additive : tables de la vérification, une liste unique par
   collecte × centre, état de vérification de la collecte.
2. `PrismaListeVerificationRepository` : passe la suite de contrat du fake
   (ADR-0003 R10).
3. Traduction des violations d'unicité en erreurs du domaine
   (TENETS-ADAPTER-006).
4. Requêtes de lecture de l'avancement.
5. Concurrence selon la décision du design doc (test d'intégration).

## Critères d'acceptation

- [ ] Aucune colonne v1 supprimée ni renommée.
- [ ] Tests d'intégration sur PostgreSQL verts.
- [ ] `pnpm agent:gate -- --full` passe.
