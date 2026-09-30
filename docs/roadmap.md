# Feuille de route RDC v2

> Document vivant : à mettre à jour à chaque fonctionnalité terminée (étape 7
> de la démarche : capitaliser). Un agent qui reprend le travail commence ici.

## Démarche pour chaque fonctionnalité

1. Spécification courte (besoin, règles métier, critères d'acceptation).
2. Design doc si la fonctionnalité touche plusieurs contextes, le modèle de
   données ou un cycle de vie complexe.
3. Découpage en cycles TDD : domaine → application → adapters → HTTP.
4. Un cycle = un comportement : test rouge, code minimal, nettoyage, commit.
5. `pnpm nx format:check && pnpm verify` avant de pousser ; CI verte avant fusion.
6. Revue d'architecture qui cite les règles `TENETS-XXX-NNN`.
7. Mise à jour de ce document, du glossaire et des ADR si besoin.

## Pyramide des tests

| Niveau                                     | Où                                | Existe | En CI | Arrive avec |
| ------------------------------------------ | --------------------------------- | ------ | ----- | ----------- |
| Domaine (unitaires)                        | `libs/*/domain/**/*.spec.ts`      | ✅     | ✅    | —           |
| Use cases (fakes en mémoire)               | `libs/*/application/**/*.spec.ts` | ✅     | ✅    | —           |
| Contrat d'adapter (en mémoire puis Prisma) | `*.test-utils.ts` + `*.spec.ts`   | ✅     | ✅    | —           |
| Intégration (Prisma + PostgreSQL)          | `*.integration.spec.ts`           | ✅     | ✅    | —           |
| E2E HTTP boîte noire                       | `apps/api-e2e`                    | ✅     | ✅    | —           |

## Étapes

| Étape | Contenu                                                            | État       |
| ----- | ------------------------------------------------------------------ | ---------- |
| 0     | Fondations : Nx, lint d'architecture, CI, règles Tenets, ADR       | ✅ Terminé |
| 1     | Référentiel : créer un centre (domaine → use case → Prisma → HTTP) | ✅ Terminé |
| 2     | Référentiel : cycle de vie d'un centre (désactiver, archiver)      | ⏳         |
| 3     | Référentiel : magasins et produits                                 | ⏳         |
| 4     | Identité et accès : bootstrap admin, connexion, rôles              | ⏳         |
| 5     | Collecte : design doc, puis création et cycle de vie               | ⏳         |
| 6     | Planification, saisie, bénévoles                                   | ⏳         |
| 7     | Statistiques (modèle de lecture séparé)                            | ⏳         |
| 8     | Front Angular 22 dans le workspace (Node ≥ 24.15)                  | ⏳         |

L'ordre des étapes 3 à 7 reste à confirmer avec la carte des contextes.

## Étape 1 — Créer un centre

| Élément                                                                                       | État |
| --------------------------------------------------------------------------------------------- | ---- |
| `CentreId` : vide, format UUID, normalisation                                                 | ✅   |
| `Nom`, `Ville` : vide, longueur maximale, espaces                                             | ✅   |
| `CodePostal` : 5 chiffres ; `Adresse` : abréviations interdites (ADR-0006)                    | ✅   |
| `Telephone` (01-07, 09, `+33`, ADR-0007) et `Email` facultatifs                               | ✅   |
| `Centre.creer()` avec l'état initial complet ; `Centre.reconstituer()`                        | ✅   |
| `CleDoublonCentre` : clé de rapprochement de la v1                                            | ✅   |
| `CreerCentreUseCase` : création, enregistrement, refus des doublons (`CENTRE_ALREADY_EXISTS`) | ✅   |
| Suite de contrat `CentreRepository` (passée par le fake en mémoire)                           | ✅   |
| `PrismaCentreRepository` (passe la même suite, sur PostgreSQL, ADR-0008)                      | ✅   |
| `POST /api/centres`, filtres d'erreurs, tests E2E (ADR-0009)                                  | ✅   |

Avant la mise en production (ADR-0008) : script de reprise qui calcule
`cleDoublon` pour les centres de la v1, puis colonne rendue obligatoire. Reste à
traduire une violation d'unicité de `cleDoublon` en `CentreDejaExistant` (créations
simultanées, TENETS-ADAPTER-006).

⚠️ **Avant tout déploiement** : authentification ADMIN sur `POST /api/centres`
(étape 4, ADR-0009).
