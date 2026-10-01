# Lot 6 — Persistance Prisma de la vérification

- **Branche :** `feat/collecte-verification-persistance`
- **Prérequis :** lot 5 fusionné ; ADR-0015 accepté par l'utilisateur
- **Révisé après le lot 1 :** le 2026-10-01 (tables seules, V-5, déclenchement
  du démarrage repris du lot 2b)

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

Stocker listes et réponses selon le modèle du design doc, avec une migration
additive sur le schéma v1 (ADR-0008), puis câbler le démarrage automatique
des collectes dans `apps/api` (reporté du lot 2b).

## Cycles TDD (dans l'ordre)

1. Migration additive : les quatre tables de la vérification et les enums
   `StatutListeVerification` et `ReponseMagasin` ; une liste unique par
   collecte × centre ; `collecteId` recopié dans chaque réponse, avec clé
   étrangère composite vers sa liste et unicité (`collecteId`, `magasinId`)
   (V-5). `Collecte.version` et `etatVerification` existent déjà (lot 2).
2. `PrismaListeVerificationRepository` : passe la suite de contrat du fake
   (ADR-0003 R10).
3. Traduction des violations d'unicité en erreurs (TENETS-ADAPTER-006) :
   liste en double → `VERIFICATION_DEJA_OUVERTE`, réponse en double pour un
   magasin → `MAGASIN_DEJA_DANS_UNE_LISTE`.
4. Requêtes de lecture de l'avancement.
5. Concurrence optimiste (ADR-0015) : `PrismaCollecteRepository` et
   `PrismaListeVerificationRepository` écrivent par identifiant et version
   lue, puis incrémentent ; zéro ligne modifiée lève
   `COLLECTE_CONCURRENT_UPDATE` ou `LISTE_VERIFICATION_CONCURRENT_UPDATE`
   (test d'intégration avec deux transactions).
6. Déclenchement dans `apps/api` de `DemarrerCollectesEchuesUseCase` (lot
   2b) : une exécution au démarrage de l'API et une exécution périodique,
   sans logique métier dans le déclencheur.

## Critères d'acceptation

- [ ] Aucune colonne v1 supprimée ni renommée.
- [ ] Tests d'intégration sur PostgreSQL verts, dont la concurrence.
- [ ] Le démarrage automatique fige les listes en base (test d'intégration).
- [ ] `pnpm agent:gate -- --full` passe.
