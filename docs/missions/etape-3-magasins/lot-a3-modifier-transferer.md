# Lot A3 — Modifier et transférer un magasin

- **Branche :** `feat/referentiel-modifier-magasin`
- **Prérequis :** A1 fusionné

## Ordre de mission (à coller dans Codex)

```text
Tu travailles dans le dépôt rdc-v2. Lis d'abord AGENTS.md, puis
docs/missions/etape-3-magasins/00-plan.md et
docs/missions/etape-3-magasins/lot-a3-modifier-transferer.md : ce dernier est
ton ordre de mission complet. Exécute le lot sur la branche
feat/referentiel-modifier-magasin, créée depuis main à jour. Travaille en TDD,
un commit par cycle au format feat(referentiel): …. Termine par
`pnpm agent:gate -- --full`, puis ouvre une pull request titrée
« feat(referentiel): modifier et transférer un magasin ».
```

## Règles

- Contrat v1 : `PATCH /api/magasins/:id`, champs facultatifs `nom`, `ville`,
  `codePostal`, `adresse`, `telephone`, `email`, `centreId`. Convention v1 :
  champ absent = inchangé, `null` = suppression (téléphone et email seulement).
- Un magasin archivé n'est plus modifiable (`MAGASIN_ARCHIVED`, 409,
  RDC-REF-002).
- Transfert (`centreId` différent) : centre existant et ACTIF
  (`CENTRE_NOT_FOUND`, `CENTRE_NON_ACTIF`, RDC-REF-010) ; méthode explicite
  `transfererVers` (RDC-REF-005).
- Doublon après modification : `MAGASIN_ALREADY_EXISTS` (409), en excluant le
  magasin lui-même.
- Une modification identique ne change pas `modifieLe`.
- La v1 clone le magasin et restaure l'état en cas d'erreur
  (`clone`, `copierEtatDepuis`) : **ne pas reprendre ce mécanisme**. Valider
  toutes les entrées avant de muter l'agrégat (TENETS-VALIDATE-001).

## Cycles TDD

1. Domaine : `modifier(champs, maintenant)` et `transfererVers(centreId, maintenant)`.
2. Use case `ModifierMagasinUseCase` : inconnu, archivé, transfert refusé,
   doublon, succès, dans l'unité de travail.
3. HTTP et E2E : 200 `MagasinDto`, 400, 404, 409.

## Critères d'acceptation

- [ ] Aucune restauration d'état par clonage.
- [ ] `pnpm agent:gate -- --full` passe.
