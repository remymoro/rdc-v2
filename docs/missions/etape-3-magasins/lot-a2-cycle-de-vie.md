# Lot A2 — Cycle de vie d'un magasin

- **Branche :** `feat/referentiel-cycle-vie-magasin`
- **Prérequis :** A1 fusionné
- **Modèle :** cycle de vie d'un centre (étape 2)

## Ordre de mission (à coller dans Codex)

```text
Tu travailles dans le dépôt rdc-v2. Lis d'abord AGENTS.md, puis
docs/missions/etape-3-magasins/00-plan.md et
docs/missions/etape-3-magasins/lot-a2-cycle-de-vie.md : ce dernier est ton
ordre de mission complet. Exécute le lot sur la branche
feat/referentiel-cycle-vie-magasin, créée depuis main à jour. Travaille en TDD,
un commit par cycle au format feat(referentiel): …, en imitant le cycle de vie
d'un centre. Termine par `pnpm agent:gate -- --full`, puis ouvre une pull
request titrée « feat(referentiel): cycle de vie d'un magasin ».
```

## Règles

RDC-REF-002 : ACTIF ⇄ INACTIF, archivage depuis les deux ; désactiver un
inactif, activer un actif ou archiver un archivé est sans effet et ne change pas
`modifieLe` ; activer ou désactiver un magasin archivé lève `MagasinArchive`
(`MAGASIN_ARCHIVED`, 409). RDC-REF-006 est **hors périmètre** (reportée à
l'étape 5) : aucune vérification de collecte ici.

## Cycles TDD

1. Domaine : `desactiver`, `activer`, `archiver`, avec les mêmes cas que
   `Centre` (sept tests de l'étape 2).
2. Use cases `DesactiverMagasinUseCase`, `ActiverMagasinUseCase`,
   `ArchiverMagasinUseCase` : `MAGASIN_NOT_FOUND` si inconnu ; ajouter `get`
   au port et à sa suite de contrat.
3. HTTP : `PATCH /api/magasins/:id/{desactiver,activer,archiver}`, 204 sans
   corps ; `MagasinIntrouvable` → 404, `MagasinArchive` → 409.
4. E2E : 204, 400 id mal formé, 404 inconnu, 409 archivé.

## Critères d'acceptation

- [ ] Concurrence : « dernier qui écrit gagne », comme le centre (ADR-0013),
      cité dans la PR.
- [ ] RDC-REF-002 passe à ✅ pour le magasin.
- [ ] `pnpm agent:gate -- --full` passe.
