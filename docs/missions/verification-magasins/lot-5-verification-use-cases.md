# Lot 5 — Use cases de la vérification

- **Branche :** `feat/collecte-verification-use-cases`
- **Prérequis :** lots 3 et 4 fusionnés ; V-3 confirmée

## Ordre de mission (à coller dans Codex)

```text
Tu travailles dans le dépôt rdc-v2. Lis d'abord AGENTS.md, puis
docs/missions/verification-magasins/00-plan.md et
docs/missions/verification-magasins/lot-5-verification-use-cases.md : ce dernier est ton ordre de mission
complet. Exécute le lot sur la branche feat/collecte-verification-use-cases, créée depuis main à jour.
Travaille en TDD : un test rouge, le code minimal, le nettoyage, un commit par
cycle, dans l'ordre des cycles du brief. Termine par `pnpm agent:gate`, puis
ouvre une pull request dont la description cite les règles RDC-… et TENETS-…
appliquées, les cycles réalisés et la section « Hors périmètre ».
```

## Objectif

Orchestrer la vérification avec des fakes en mémoire. Le périmètre « son
centre » est une règle applicative testée (ADR-0003 R11) : chaque use case
reçoit l'acteur (`{ role, centreId }`) dans sa commande, en attendant
l'étape 4.

## Cycles TDD (dans l'ordre)

1. `OuvrirVerificationUseCase` : ouvre la vérification et crée les listes
   préremplies (contrat referentiel du lot 3 + participants de la collecte
   précédente), dans une seule unité de travail (RDC-COLLECTE-014).
2. `RepondreMagasinUseCase` : responsable de son centre seulement, ou admin
   (RDC-COLLECTE-015, RDC-ACCES-002).
3. `TransmettreListeUseCase` (RDC-COLLECTE-020) et `RenvoyerListeUseCase`
   (admin seulement, RDC-COLLECTE-021).
4. `InscrireEnLotUseCase` : liste TRANSMISE uniquement, sans doublon, centre
   gestionnaire = centre de la liste (RDC-COLLECTE-017).
5. `FermerVerificationUseCase`, et figement des listes au démarrage
   (RDC-COLLECTE-018).
6. Lectures : avancement de toutes les listes (admin), liste de son centre
   (responsable) (RDC-COLLECTE-016).
7. Avertissement avant démarrage : listes non transmises, magasins « à
   contacter ».

## Critères d'acceptation

- [ ] Chaque use case qui écrit passe par `unitOfWork.run()` + `commit()`.
- [ ] Un test « autre centre → refusé » par use case accessible au responsable.
- [ ] `pnpm agent:gate` passe.
