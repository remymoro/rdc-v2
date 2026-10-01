# Lot 2b — Démarrer une collecte

- **Branche :** `feat/collecte-demarrer`
- **Prérequis :** lot 2 fusionné
- **Peut avancer en parallèle des lots 3 et 4**
- **À réviser après le lot 1 :** oui

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
moins un magasin inscrit (RDC-COLLECTE-002). Le lot 5 s'appuie sur ce
démarrage pour figer les listes de vérification (RDC-COLLECTE-018).

Le serveur de production est éteint hors saison : le démarrage ne doit pas
dépendre d'une tâche qui aurait dû tourner pendant l'arrêt. Il est tenté au
démarrage de l'API, puis périodiquement, et chaque tentative est idempotente.

## À lire

- `docs/domaine/collecte.md` : RDC-COLLECTE-001, 002
- `docs/architecture/regles/08-use-cases.md`, `09-unit-of-work.md`

## Cycles TDD (dans l'ordre)

1. `Collecte.demarrer(maintenant)` : PREPARATION → EN_COURS quand
   `maintenant >= dateDebut` et au moins une participation.
2. Refus : avant la date (`COLLECTE_DEMARRAGE_AVANT_DATE_DEBUT`), sans
   magasin (`COLLECTE_AUCUN_MAGASIN_INSCRIT`), statut autre que PREPARATION
   (`COLLECTE_STATUT_INVALIDE`).
3. `DemarrerCollecteUseCase` : charge, démarre, enregistre dans une unité de
   travail ; prévoit le point d'extension où le lot 5 figera les listes.
4. `DemarrerCollectesEchuesUseCase` : démarre toutes les collectes en
   PREPARATION dont la date est atteinte ; une collecte sans magasin est
   journalisée et laissée en PREPARATION ; relancé deux fois, il ne fait rien
   de plus.
5. Persistance du statut (table `Collecte` v1).
6. Déclenchement dans `apps/api` : une exécution au démarrage de l'API et une
   exécution périodique, sans logique métier dans le déclencheur.

## Hors périmètre

Route HTTP de démarrage manuel, clôture, planification, vérification.

## Critères d'acceptation

- [ ] Aucune règle de démarrage hors de `Collecte.demarrer` (RDC-COLLECTE-002).
- [ ] Test d'idempotence de `DemarrerCollectesEchuesUseCase`.
- [ ] RDC-COLLECTE-002 passe à ✅.
- [ ] `pnpm agent:gate -- --full` passe.
