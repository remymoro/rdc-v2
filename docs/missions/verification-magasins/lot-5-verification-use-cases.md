# Lot 5 — Use cases de la vérification

- **Branche :** `feat/collecte-verification-use-cases`
- **Prérequis :** lots 2b, 3 et 4 fusionnés ; V-3 confirmée
- **Révisé après le lot 1 :** le 2026-10-01 (figement au démarrage livré par
  le lot 2b, ajout à une liste et V-5, inscription en lot revalidée)

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
   préremplies (port `CandidatsVerification` du lot 3 + participants de la
   dernière collecte TERMINEE), dans une seule unité de travail ; une
   ouverture partielle est toujours annulée (RDC-COLLECTE-014).
2. `AjouterMagasinAListeUseCase` (admin) : magasin ACTIF et centre ACTIF via
   le port, liste du centre de rattachement (aucun `centreId` du client),
   doublon dans la même liste sans effet ; magasin déjà dans la liste d'un
   autre centre refusé (`MAGASIN_DEJA_DANS_UNE_LISTE`, 409, V-5).
3. `RepondreMagasinUseCase` : responsable du centre de la liste seulement,
   l'admin ne saisit pas de réponse (RDC-COLLECTE-015, RDC-ACCES-002).
4. `TransmettreListeUseCase` (responsable de son centre, ou admin à titre
   exceptionnel, RDC-COLLECTE-020) et `RenvoyerListeUseCase` (admin
   seulement, RDC-COLLECTE-021).
5. `InscrireEnLotUseCase` : liste TRANSMISE et non figée, vérification
   OUVERTE, collecte en PREPARATION ; revalide l'état actuel de chaque magasin
   PARTICIPE et de son centre par `MagasinsInscriptibles` (jamais l'instantané
   d'ouverture) ; centre gestionnaire = centre de la liste ; déjà inscrits sans
   effet ; un magasin devenu non inscriptible fait échouer tout le lot ; la
   liste est sauvegardée avec contrôle de version même sans changement
   (RDC-COLLECTE-017, design « Inscription en lot »).
6. `FermerVerificationUseCase` : ferme la vérification et fige toutes les
   listes dans la même unité de travail (RDC-COLLECTE-018). Le figement au
   démarrage est déjà livré par le lot 2b.
7. Lectures : avancement de toutes les listes (admin), liste de son centre
   (responsable) (RDC-COLLECTE-016).
8. Avertissement avant démarrage : listes non transmises, magasins « à
   contacter ».

## Critères d'acceptation

- [ ] Chaque use case qui écrit passe par `unitOfWork.run()` + `commit()`.
- [ ] Un test « autre centre → refusé » par use case accessible au responsable.
- [ ] `pnpm agent:gate` passe.
