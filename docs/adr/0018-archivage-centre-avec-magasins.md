# ADR-0018 — Un centre ne s'archive pas tant qu'il a des magasins

- **Statut :** accepté
- **Date :** 2026-10-02

## Contexte

En RDC v1, archiver un centre ne regarde pas ses magasins (aucune règle trouvée
dans le code ni dans la documentation reprise). Un magasin ACTIF peut donc
rester rattaché à un centre ARCHIVE : plus aucun centre ne le gère, et
RDC-REF-010 interdit de lui rattacher à nouveau ce centre. La décision D-18
(`docs/domaine/a-trancher.md`) tranche ce cas ; elle ajoute une règle absente
de la v1, d'où cet ADR.

## Décision

1. `ArchiverCentreUseCase` refuse l'archivage tant qu'un magasin ACTIF ou
   INACTIF est rattaché au centre : `CentreADesMagasins`
   (`CENTRE_A_DES_MAGASINS`, 409). Les magasins archivés ne comptent pas.
   Archiver un centre déjà archivé reste sans effet (RDC-REF-011).
2. La règle est vérifiée dans l'unité de travail par le use case, via
   `MagasinRepository.existsNonArchiveDuCentre(centreId)` : elle porte sur
   deux agrégats, chacun gardant son repository (TENETS-AGGREGATE-006).
   L'erreur est donc applicative (TENETS-ERROR-003).
3. La désactivation d'un centre reste permise : elle est réversible et les
   magasins gardent leur rattachement pendant la pause.
4. Les lectures de centres (`GET /api/centres`, `/api/centres/:id`) ajoutent au
   `CentreDto` de la v1 un champ `magasins: { actifs, inactifs }`, pour que
   l'écran annonce le blocage avant l'appel.

## Options écartées

- **Transfert obligatoire dans la même opération** : mélange deux décisions
  (archiver, choisir un nouveau centre) en une seule requête.
- **Archivage en cascade des magasins** : effet caché, qui retirerait des
  magasins encore utiles à un autre centre.

## Conséquences

- L'admin transfère ou archive d'abord les magasins, puis archive le centre.
- Course possible : un magasin créé ou transféré vers le centre pendant son
  archivage. Le risque est accepté comme pour l'ADR-0013 (un seul rôle, l'admin,
  agit sur le référentiel) ; à revoir avec l'étape 4 si un autre rôle peut
  rattacher des magasins.
- RDC-REF-004 (statut figé pendant les collectes actives, étape 5) s'ajoutera
  à cette règle sans la remplacer.
