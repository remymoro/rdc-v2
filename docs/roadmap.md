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

| Niveau                                     | Où                                | Existe | En CI | Arrive avec                                    |
| ------------------------------------------ | --------------------------------- | ------ | ----- | ---------------------------------------------- |
| Domaine (unitaires)                        | `libs/*/domain/**/*.spec.ts`      | ✅     | ✅    | —                                              |
| Use cases (fakes en mémoire)               | `libs/*/application/**/*.spec.ts` | ❌     | ✅\*  | `CreerCentreUseCase`                           |
| Contrat d'adapter (en mémoire puis Prisma) | `*.test-utils.ts` + `*.spec.ts`   | ❌     | ❌    | `CentreRepository`                             |
| Intégration (Prisma + PostgreSQL)          | `*.integration.spec.ts`           | ❌     | ❌    | `PrismaCentreRepository` : Prisma, Docker, CI  |
| E2E HTTP boîte noire                       | `apps/api-e2e`                    | ⚠️     | ❌    | `POST /api/centres` : remplace l'exemple de Nx |

\* La cible `test` existe déjà : les premiers tests de use case tourneront en CI
sans autre changement.

À faire au passage :

- Supprimer les exemples générés par Nx (`AppController`, `AppService`, test
  `GET /api` → `Hello API`) quand la première vraie route existe.
- Ajouter l'étape `pnpm nx affected -t e2e` (et `test-integration`) dans la CI,
  avec un service PostgreSQL, dès le premier test de ces niveaux (ADR-0004).

## Étapes

| Étape | Contenu                                                            | État        |
| ----- | ------------------------------------------------------------------ | ----------- |
| 0     | Fondations : Nx, lint d'architecture, CI, règles Tenets, ADR       | ✅ Terminé  |
| 1     | Référentiel : créer un centre (domaine → use case → Prisma → HTTP) | 🟡 En cours |
| 2     | Référentiel : cycle de vie d'un centre (désactiver, archiver)      | ⏳          |
| 3     | Référentiel : magasins et produits                                 | ⏳          |
| 4     | Identité et accès : bootstrap admin, connexion, rôles              | ⏳          |
| 5     | Collecte : design doc, puis création et cycle de vie               | ⏳          |
| 6     | Planification, saisie, bénévoles                                   | ⏳          |
| 7     | Statistiques (modèle de lecture séparé)                            | ⏳          |
| 8     | Front Angular 22 dans le workspace (Node ≥ 24.15)                  | ⏳          |

L'ordre des étapes 3 à 7 reste à confirmer avec la carte des contextes.

## Étape 1 — Créer un centre

| Élément                                                         | État |
| --------------------------------------------------------------- | ---- |
| `Centre.creer()` : statut `ACTIF`, identifiant, dates           | ✅   |
| `Nom` : vide (`NOM_EMPTY`), trop long (`NOM_TOO_LONG`), espaces | ✅   |
| `CentreId` : vide, format UUID, normalisation                   | ✅   |
| Adresse : code postal, ville, voie sans abréviation             | ⏳   |
| Téléphone et email facultatifs                                  | ⏳   |
| `CreerCentreUseCase`, refus des doublons                        | ⏳   |
| `CentreRepository` + contrat, puis `PrismaCentreRepository`     | ⏳   |
| `POST /api/centres`, erreurs HTTP, test E2E                     | ⏳   |

À ne pas oublier pour l'adapter HTTP : un téléphone vide (`""`) signifie « pas de
téléphone » et doit être converti en absent avant d'appeler le domaine (ADR-0007).
