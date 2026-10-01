# Mission — Étape 3 : magasins et produits du référentiel

- **Ouverte le :** 2026-10-01
- **Règles :** RDC-REF-001 à 010 (`docs/domaine/referentiel.md`), sauf
  RDC-REF-004 (reportée à l'étape 5), RDC-REF-006 (reportée à l'étape 5, D-03)
  et RDC-REF-009 (statistiques, D-04)
- **Exécutant :** Codex, un lot = une branche = une pull request
- **Orchestration et relecture :** Claude Code
- **Modèle à imiter :** la création et le cycle de vie d'un centre (étapes 1
  et 2, `libs/referentiel/**`)

## Objectif

Le siège gère les magasins de chaque centre (les créer quand un nouveau
magasin rejoint l'opération, les modifier, les transférer vers un autre centre,
les mettre en pause ou les archiver) et le catalogue des produits. C'est le
référentiel dont la collecte a besoin : le lot 3 de la mission
`verification-magasins` s'appuie sur le repository `Magasin` livré ici.

## Lots

```text
A1  Créer un magasin                   (domaine → HTTP, comme le centre)
 ├── A2  Cycle de vie d'un magasin    (désactiver, activer, archiver)
 ├── A3  Modifier et transférer       (PATCH, transfert vers un autre centre)
 └── A4  Lire les magasins            (liste, liste d'un centre, détail)
B   Catalogue des produits             (indépendant des lots A)
C   Images d'un magasin                (après A1 et confirmation du lieu NAS)
```

| Lot | Brief                           | Branche                              | Prérequis                          | État      |
| --- | ------------------------------- | ------------------------------------ | ---------------------------------- | --------- |
| A1  | `lot-a1-creer-magasin.md`       | `feat/referentiel-creer-magasin`     | —                                  | 🟢 prêt   |
| A2  | `lot-a2-cycle-de-vie.md`        | `feat/referentiel-cycle-vie-magasin` | A1                                 | ⏸ bloqué |
| A3  | `lot-a3-modifier-transferer.md` | `feat/referentiel-modifier-magasin`  | A1                                 | ⏸ bloqué |
| A4  | `lot-a4-lire-magasins.md`       | `feat/referentiel-lire-magasins`     | A1                                 | ⏸ bloqué |
| B   | `lot-b-produits.md`             | `feat/referentiel-produits`          | —                                  | 🟢 prêt   |
| C   | `lot-c-images.md`               | `feat/referentiel-images-magasin`    | A1 + lieu de stockage NAS confirmé | ⏸ bloqué |

A2, A3 et A4 peuvent avancer en parallèle après A1 ; A1 et B dès maintenant.
Le lot C attend aussi la confirmation du lieu de stockage après le rendez-vous NAS.
Le lot 3 de `verification-magasins` attend A1 et A2 (magasin et statut).

## Ce qui ne fait pas partie de l'étape 3

- **RDC-REF-006** (magasin engagé dans une collecte active) : reportée à
  l'étape 5 (D-03). Désactiver ou archiver un magasin n'est donc pas encore
  bloqué par les collectes.
- **RDC-REF-009** (enseigne) : D-04 décidée, convention v1, rien à coder ici.
- **Contrôle de rôle** : arrive à l'étape 4. Les routes ne sont pas protégées
  et l'API refuse toujours de démarrer en production
  (`verifierDeploiementAutorise`, ADR-0009).
- **Contrat publié vers `collecte`** : livré par le lot 3 de
  `verification-magasins` (ADR-0014, proposé ; design fusionné par la PR #9,
  qui ajoute aussi `obtenirCentre` au contrat).

## Contrat HTTP de la v1 à conserver (ADR-0009)

Le front v1 doit fonctionner sans modification : mêmes routes, mêmes corps,
mêmes statuts et codes d'erreur que la v1 pour ce qui existe déjà.

| Méthode et route v1                        | Lot | Réponse v1          |
| ------------------------------------------ | --- | ------------------- |
| `POST /api/centres/:centreId/magasins`     | A1  | 201, `MagasinDto`   |
| `PATCH /api/magasins/:id/desactiver`       | A2  | 204                 |
| `PATCH /api/magasins/:id/activer`          | A2  | 204                 |
| `PATCH /api/magasins/:id/archiver`         | A2  | 204                 |
| `PATCH /api/magasins/:id`                  | A3  | 200, `MagasinDto`   |
| `GET /api/magasins`                        | A4  | 200, `MagasinDto[]` |
| `GET /api/centres/:centreId/magasins`      | A4  | 200, `MagasinDto[]` |
| `GET /api/magasins/:id`                    | A4  | 200, `MagasinDto`   |
| `POST /api/magasins/:id/images`            | C   | 201                 |
| `DELETE /api/magasins/:id/images/:imageId` | C   | 204                 |
| `POST`, `GET`, `PATCH /api/produits…`      | B   | voir le brief B     |

Source v1 : `../rdc/apps/api/src/presentation/http/controllers/magasin.controller.ts`
et `produit.controller.ts`, mapper `presentation/http/mappers/magasin.mapper.ts`.

## Boucle de travail

Identique à la mission `verification-magasins` (`00-plan.md`, « Boucle de
travail pour chaque lot ») : Codex ouvre une PR par lot avec un titre au format
`feat(referentiel): …`, Claude relit et écrit la revue dans `docs/revues/`,
l'utilisateur fusionne quand la CI est verte, les conversations résolues et la
revue `acceptee`.
