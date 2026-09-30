# ADR-0006 — Abréviations de voie : règle de RDC v1 conservée

- **Statut :** accepté
- **Date :** 2026-09-30

## Contexte

RDC v1 refuse une adresse qui contient une abréviation de type de voie, pour
imposer la forme complète (« Avenue » et non « AV. »). Le contrôle porte sur
chaque mot, sans tenir compte de la casse, avec 19 abréviations : `AV`, `AVE`,
`BD`, `BLVD`, `RTE`, `IMP`, `ALL`, `SQ`, `FG`, `PL`, `ESP`, `PASS`, `VLA`,
`RES`, `RESID`, `CHE`, `CRS`, `HAM`, `LOT`.

Limite connue : un nom propre identique à une abréviation est refusé à tort,
par exemple « 12 rue du Lot » (rivière et département du Lot).

Alternatives étudiées :

1. reprendre la v1 à l'identique ;
2. ne refuser l'abréviation que suivie d'un point ou placée après le numéro ;
3. retirer de la liste les mots ambigus (`LOT`, `PASS`, `RES`, `ALL`).

## Décision

Option 1 : la règle de RDC v1 est reprise **à l'identique**, liste et contrôle
mot à mot compris. Le client a validé ce comportement.

## Conséquences

- Même comportement et même code d'erreur (`ADRESSE_ABREVIATION_INTERDITE`)
  que la v1 pour le front et les utilisateurs.
- Le refus à tort de noms propres comme « Lot » est un comportement **voulu et
  testé**, pas un défaut à corriger en revue.
- Si le client demande à accepter ces adresses, écrire un nouvel ADR qui
  remplace celui-ci (option 2 ou 3), avec les tests correspondants.
