# Lot 3 — Inscrire les magasins et reprendre la collecte précédente

- **Branche :** `feat/collecte-inscrire-magasins`
- **Prérequis :** lot 2 fusionné ; étape 3 (magasins) fusionnée
- **À réviser après le lot 1 :** oui

## Ordre de mission (à coller dans Codex)

```text
Tu travailles dans le dépôt rdc-v2. Lis d'abord AGENTS.md, puis
docs/missions/verification-magasins/00-plan.md et
docs/missions/verification-magasins/lot-3-inscrire-magasins.md : ce dernier est ton ordre de mission
complet. Exécute le lot sur la branche feat/collecte-inscrire-magasins, créée depuis main à jour.
Travaille en TDD : un test rouge, le code minimal, le nettoyage, un commit par
cycle, dans l'ordre des cycles du brief. Termine par `pnpm agent:gate -- --full`, puis
ouvre une pull request dont la description cite les règles RDC-… et TENETS-…
appliquées, les cycles réalisés et la section « Hors périmètre ».
```

## Objectif

Le temps 1 de la mission : l'admin inscrit, retire ou réassigne des magasins
en préparation, et peut reprendre en une fois les participants de la collecte
précédente. Ce lot crée aussi le premier contrat publié entre contextes :
`referentiel` publie « magasins actifs rattachés à chaque centre actif »,
`collecte` le consomme par un adapter de traduction. Le lot 5 le réutilise.

## À lire

- `docs/design/collecte.md` (contrats inter-contextes)
- RDC-COLLECTE-004, 013, 019 ; RDC-REF-005, RDC-REF-010
- `docs/architecture/regles/10-contextes.md` (CONTEXT-002 à 006)

## Cycles TDD (dans l'ordre)

1. `Collecte.inscrireMagasin` en PREPARATION ; magasin déjà inscrit : sans
   effet, `modifieLe` inchangé.
2. Refus hors PREPARATION.
3. `retirerMagasin` et `reassignerMagasin` ; magasin non inscrit :
   `MagasinNonInscrit`.
4. ADR du contrat publié (proposé par le design doc) : lib
   `libs/referentiel/contrat` taguée `scope:published` et contrainte ESLint
   qui ne la laisse importer que par des libs `layer:adapters` d'autres
   contextes ; un test de lint qui échoue si `collecte/domain` ou
   `collecte/application` l'importe.
5. Contrat publié par `referentiel` : façade « magasins actifs par centre
   actif » en primitives, implémentée par `referentiel/adapters` sur le
   repository `Magasin` de l'étape 3.
6. Port consommateur de `collecte`, dans son langage, avec suite de contrat
   et fake en mémoire.
7. Adapter de traduction dans `collecte/adapters` : appelle la façade publiée
   et traduit vers les types du port (TENETS-CONTEXT-004).
8. `InscrireMagasinUseCase` : magasin actif connu du référentiel, centre
   gestionnaire = centre de rattachement par défaut.
9. `ReprendreCollectePrecedenteUseCase` (RDC-COLLECTE-019) : participants de
   la dernière collecte TERMINEE encore actifs, sans doublon.
10. Persistance des participations (table `ParticipationMagasin` v1).
11. HTTP : routes d'inscription, de retrait, de réassignation et de reprise,
    et E2E.

## Hors périmètre

Listes de vérification, contrôle de rôle (étape 4 : routes non protégées,
déploiement toujours bloqué par `verifierDeploiementAutorise`).

## Critères d'acceptation

- [ ] `collecte` n'importe que `@rdc/referentiel-contrat`, et seulement
      depuis `collecte/adapters` (TENETS-CONTEXT-002 à 004) ; `referentiel`
      n'importe rien de `collecte`.
- [ ] RDC-COLLECTE-004 et 019 passent à ✅.
- [ ] `pnpm agent:gate -- --full` passe.
