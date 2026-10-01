# Lot 2b — Démarrer une collecte

- **Branche :** `feat/collecte-demarrer`
- **Prérequis :** lots 2 et 4 fusionnés
- **Peut avancer en parallèle du lot 3**
- **Révisé après le lot 1 :** le 2026-10-01 (passe après le lot 4, fige les
  listes ; déclenchement dans `apps/api` reporté au lot 6)

## Ordre de mission (à coller dans Codex)

```text
Tu travailles dans le dépôt rdc-v2. Lis d'abord AGENTS.md, puis
docs/missions/verification-magasins/00-plan.md et
docs/missions/verification-magasins/lot-2b-demarrer-collecte.md : ce dernier
est ton ordre de mission complet. Exécute le lot sur la branche
feat/collecte-demarrer, créée depuis main à jour. Travaille en TDD : un test
rouge, le code minimal, le nettoyage, un commit par cycle, dans l'ordre des
cycles du brief. Termine par `pnpm agent:gate -- --full`, puis ouvre une pull
request dont la description cite les règles RDC-… et TENETS-… appliquées, les
cycles réalisés et la section « Hors périmètre ».
```

## Objectif

Passer une collecte de PREPARATION à EN_COURS à sa date de début, avec au
moins un magasin inscrit (RDC-COLLECTE-002). Le démarrage ferme la
vérification et fige toutes les listes de la collecte dans la même unité de
travail (RDC-COLLECTE-018, design « Fermer ou démarrer »).

Le serveur de production est éteint hors saison : le démarrage ne doit pas
dépendre d'une tâche qui aurait dû tourner pendant l'arrêt. Il sera tenté au
démarrage de l'API, puis périodiquement, et chaque tentative est idempotente.
Ce lot livre le use case idempotent ; son déclenchement dans `apps/api` est
câblé au lot 6, quand le repository Prisma des listes existe.

## À lire

- `docs/domaine/collecte.md` : RDC-COLLECTE-001, 002, 018
- `docs/design/collecte.md` : « Fermer ou démarrer », « Concurrence »
- `docs/architecture/regles/08-use-cases.md`, `09-unit-of-work.md`

## Cycles TDD (dans l'ordre)

1. `Collecte.demarrer(maintenant)` : PREPARATION → EN_COURS quand
   `maintenant >= dateDebut` et au moins une participation.
2. Refus : avant la date (`COLLECTE_DEMARRAGE_AVANT_DATE_DEBUT`), sans
   magasin (`COLLECTE_AUCUN_MAGASIN_INSCRIT`), statut autre que PREPARATION
   (`COLLECTE_STATUT_INVALIDE`), tous en 400 comme en v1.
3. Le démarrage passe la vérification à FERMEE si elle était OUVERTE, et la
   laisse NON_OUVERTE sinon.
4. `DemarrerCollecteUseCase` : charge la collecte et toutes ses listes
   (repository du lot 4, fake en mémoire), démarre, appelle
   `figer(maintenant)` sur chaque liste et enregistre toutes les racines dans
   une seule unité de travail ; un conflit de version annule tout.
5. `DemarrerCollectesEchuesUseCase` : démarre toutes les collectes en
   PREPARATION dont la date est atteinte ; une collecte sans magasin est
   journalisée et laissée en PREPARATION ; relancé deux fois, il ne fait rien
   de plus.
6. Persistance du statut et de l'état de vérification (table `Collecte`, lot 2).

## Hors périmètre

Route HTTP de démarrage manuel, clôture, planification, use cases de la
vérification (lot 5), déclenchement dans `apps/api` (lot 6).

## Critères d'acceptation

- [ ] Aucune règle de démarrage hors de `Collecte.demarrer` (RDC-COLLECTE-002).
- [ ] Test d'idempotence de `DemarrerCollectesEchuesUseCase`.
- [ ] Test : après démarrage, aucune liste de la collecte n'accepte de
      réponse, transmission ni renvoi (`VerificationFermee`).
- [ ] RDC-COLLECTE-002 passe à ✅.
- [ ] `pnpm agent:gate -- --full` passe.
