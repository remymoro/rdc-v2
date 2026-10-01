# Lot A1 — Créer un magasin

- **Branche :** `feat/referentiel-creer-magasin`
- **Prérequis :** aucun
- **Modèle :** création d'un centre (étape 1)

## Ordre de mission (à coller dans Codex)

```text
Tu travailles dans le dépôt rdc-v2. Lis d'abord AGENTS.md, puis
docs/missions/etape-3-magasins/00-plan.md et
docs/missions/etape-3-magasins/lot-a1-creer-magasin.md : ce dernier est ton
ordre de mission complet. Exécute le lot sur la branche
feat/referentiel-creer-magasin, créée depuis main à jour. Travaille en TDD : un
test rouge, le code minimal, le nettoyage, un commit par cycle au format
feat(referentiel): …, dans l'ordre des cycles du brief. Imite la création d'un
centre (libs/referentiel/**). Termine par `pnpm agent:gate -- --full`, puis
ouvre une pull request titrée « feat(referentiel): créer un magasin » qui cite
les règles RDC-… et TENETS-… appliquées et liste les cycles réalisés.
```

## À lire

- `docs/domaine/referentiel.md` : RDC-REF-001, 002, 003, 005, 010
- `docs/domaine/glossaire.md` : Magasin, Rattachement
- `docs/architecture/regles/04-entites-valeurs.md`, `05-agregats-services.md`,
  `06-creation-reconstitution.md`, `07-repositories.md`, `03-adapters-api.md`,
  `12-erreurs.md`, `14-tests.md`
- Code à imiter : `libs/referentiel/domain/src/centre/`,
  `libs/referentiel/application/src/use-cases/creer-centre.use-case.ts`,
  `libs/referentiel/adapters/src/{http,prisma}/`
- Référence v1 : `../rdc/libs/domain/src/magasin/magasin.entity.ts`,
  `../rdc/apps/api/src/application/use-cases/magasin/creer-magasin.usecase.ts`,
  `../rdc/apps/api/src/presentation/http/dtos/requests/creer-magasin.request.ts`

## Règles à appliquer

- Les value objects de `commun/` (`Nom`, `Adresse`, `CodePostal`, `Ville`,
  `Telephone`, `Email`) sont **réutilisés**, pas recopiés (RDC-REF-003,
  ADR-0006, ADR-0007).
- Un magasin est créé ACTIF, rattaché à un centre (`centreId`, RDC-REF-005).
- Le centre doit exister (`CENTRE_NOT_FOUND`, 404) et être ACTIF
  (`CENTRE_NON_ACTIF`, 409, RDC-REF-010).
- **Doublon** : `MAGASIN_ALREADY_EXISTS` (409). La v1 vérifie le doublon par
  centre dans le use case, mais la base impose l'unicité sur nom, ville, code
  postal et adresse **sans** le centre
  (`../rdc/apps/api/prisma/schema.prisma`, `@@unique` de `Magasin`). C'est la
  base qui fait foi : la clé de doublon est globale, comme `CleDoublonCentre`
  (RDC-REF-001). Le signaler dans la PR.
- Pas de champ `enseigne` (D-04).

## Cycles TDD (dans l'ordre)

1. `MagasinId` : vide, format UUID, normalisation (comme `CentreId`).
2. `StatutMagasin` : ACTIF, INACTIF, ARCHIVE.
3. `Magasin.creer(nouveau, maintenant)` : état initial complet, statut ACTIF,
   `creeLe = modifieLe = maintenant`, centre de rattachement, téléphone et
   email facultatifs.
4. `Magasin.reconstituer(etat)` : état persisté restitué tel quel.
5. `CleDoublonMagasin` : même normalisation que `CleDoublonCentre`.
6. Port `MagasinRepository` (`save`, `existsByCleDoublon`) et sa suite de
   contrat, passée par un fake en mémoire.
7. `CreerMagasinUseCase` : centre introuvable, centre non actif, doublon,
   succès ; tout dans l'unité de travail. Le centre est lu par le
   `CentreRepository` existant (même contexte, pas de contrat publié).
8. `PrismaMagasinRepository` sur la table `Magasin` v1 : passe la même suite
   de contrat (ADR-0003 R10), test d'intégration.
9. `POST /api/centres/:centreId/magasins` : DTO de forme seulement
   (TENETS-VALIDATE-002), chaîne vide = champ absent pour téléphone et email
   (ADR-0007), réponse `MagasinDto` v1 avec `images: []`, filtre d'erreurs du
   contexte.
10. E2E : 201, 400 (requête mal formée, règle métier), 404 centre inconnu,
    409 centre inactif, 409 doublon.

## Hors périmètre

Cycle de vie (A2), modification et transfert (A3), lectures (A4), images (C),
contrôle de rôle (étape 4), RDC-REF-006.

## Critères d'acceptation

- [ ] Aucun value object dupliqué entre `centre/` et `magasin/`.
- [ ] Mêmes statuts et codes que la v1 pour la route existante (ADR-0009).
- [ ] RDC-REF-005 passe à ✅ pour la création ; feuille de route (étape 3) à jour.
- [ ] `pnpm agent:gate -- --full` passe.
