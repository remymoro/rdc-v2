# ADR-0017 — Concurrence sur Magasin : le dernier qui écrit gagne

- **Statut :** proposé
- **Date :** 2026-10-02

## Contexte

Le lot A2 ajoute le cycle de vie d'un magasin (désactiver, activer, archiver).
Comme pour le centre, les use cases relisent le magasin par
`MagasinRepository.get()` sans verrou, appliquent la méthode de l'agrégat, puis
`PrismaMagasinRepository.save()` fait un `upsert` complet de la ligne, en
`READ COMMITTED`. Le scénario décrit par l'ADR-0013 s'applique donc à l'identique :
un magasin archivé par une requête peut redevenir `ACTIF` si une requête
d'activation concurrente, partie de l'état lu avant l'archivage, valide après
elle.

L'ADR-0013 ne couvre que `Centre`. TENETS-AGGREGATE-007 exige une stratégie de
conflit explicite pour chaque agrégat modifiable par des écritures concurrentes.

## Décision proposée

1. **« Le dernier qui écrit gagne »** pour `Magasin`, comme pour `Centre` et
   comme en RDC v1 : seul l'administrateur du siège crée, modifie, transfère,
   désactive ou archive un magasin. Deux écritures concurrentes sur le même
   magasin sont improbables et se corrigent à la main.
2. Aucun verrou ni colonne de version : `get()` et `save()` restent inchangés.
3. Les créations simultanées restent protégées par la contrainte unique
   `cleDoublon` (lot A1) : elles ne relèvent pas de cet ADR.

Les options écartées sont celles de l'ADR-0013 (verrou pessimiste, version
optimiste, transaction `Serializable`), pour les mêmes raisons.

## Conséquences

- Le scénario de l'ADR-0013 reste possible pour un magasin ; il n'est ni
  détecté ni testé.
- **À revoir** si un second rôle peut modifier un magasin (étape 4), ou quand
  D-03 donnera à `collecte` une action sur le statut d'un magasin (retrait
  automatique, RDC-REF-006) : une version optimiste, comme celle d'ADR-0015,
  deviendrait alors nécessaire. Un nouvel ADR remplacera celui-ci, et la
  stratégie entrera dans la suite de contrat de `MagasinRepository`.
- Une revue qui cite TENETS-AGGREGATE-007 sur `Magasin` renvoie à cet ADR.
