# ADR-0011 — Cycle de vie d'un centre : transitions et concurrence optimiste

- **Statut :** proposé
- **Date :** 2026-10-01

## Contexte

L'étape 2 ajoute la désactivation, la réactivation et l'archivage d'un centre
(spécification : `docs/specs/referentiel-cycle-de-vie-centre.md`). Le code de
RDC v1 n'est pas disponible pour cette étape ; seul son schéma l'est, avec un
enum `StatutCentre { ACTIF, INACTIF, ARCHIVE }` que le domaine v2 ne reprend
qu'en partie. Plusieurs administrateurs peuvent agir sur le même centre : sans
précaution, une désactivation concurrente d'un archivage écraserait le statut
`ARCHIVE`, pourtant définitif (TENETS-AGGREGATE-007).

## Décision

1. **Statuts** : le domaine reprend `ACTIF`, `INACTIF`, `ARCHIVE`.
2. **Transitions** portées par `Centre` (TENETS-ENTITY-002) : `ACTIF ⇄ INACTIF`,
   `ACTIF | INACTIF → ARCHIVE`. `ARCHIVE` est définitif : `desactiver()` et
   `reactiver()` y lèvent `CentreArchive` (`CENTRE_ARCHIVED`). Pas de
   désarchivage.
3. **Idempotence** : une action qui mène au statut déjà en place est sans effet
   (ni erreur, ni changement de `modifieLe`).
4. **Pas de condition inter-contextes** dans cette étape (collectes, magasins,
   bénévoles, responsables) : elles arriveront avec leurs contextes.
5. **Concurrence optimiste** : colonne `Centre.version` (entier, défaut 0,
   migration additive). `version` fait partie de l'état reconstitué ;
   `PrismaCentreRepository.save` met à jour sous condition
   `WHERE id = … AND version = <version lue>` et incrémente la version. Une
   ligne existante dont la version a changé lève `ConflitModificationCentre`
   (`CENTRE_CONCURRENT_MODIFICATION`, HTTP 409), déclarée à côté du port
   (TENETS-ERROR-004) et vérifiée par la suite de contrat (ADR-0003 R10).
6. **Contrat HTTP provisoire** : `PATCH /api/centres/:id/{desactiver|reactiver|archiver}`,
   réponse 200 `CentreReponse`, routes non protégées jusqu'à l'étape 4
   (ADR-0009). À remplacer par les routes v1 si elles diffèrent.

## Conséquences

- Les centres `INACTIF` repris de la v1 se reconstituent sans erreur.
- La version protège aussi les futures modifications du centre (coordonnées,
  responsables) sans nouveau mécanisme.
- Le fake en mémoire doit reproduire le conflit de version : il stocke des
  copies, pas les instances.
- La v1, si elle écrit encore dans la même base, n'incrémente pas `version` :
  ses écritures ne sont pas détectées. Acceptable tant que la v1 et la v2 ne
  tournent pas en même temps en production.
- Les routes et les codes `CENTRE_NOT_FOUND` / `CENTRE_CONCURRENT_MODIFICATION`
  restent à confirmer contre la v1 ; l'ADR passe à « accepté » une fois vérifiés.
