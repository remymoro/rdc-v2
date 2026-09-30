# Règles d'architecture RDC v2 (Tenets, profil `pragmatic`, adaptées à NestJS)

Ces règles sont la traduction en TypeScript/NestJS du catalogue
[Tenets](https://github.com/bardiakhosravi/tenets), profil `pragmatic` (règles
`core` + `pragmatic`). Les identifiants `TENETS-XXX-NNN` sont ceux de Tenets :
ils ne sont jamais renumérotés, pour qu'une revue puisse citer la règle exacte.
Les règles `strict` (outbox/inbox, idempotence asynchrone, ADR avancés) ne sont
pas reprises ; voir ADR-0005.

Les fichiers détaillés se chargent automatiquement selon le dossier modifié
(en-tête `paths:`). Ce fichier-ci est toujours chargé.

## Comment les utiliser

- **Avant de coder** : lis le fichier de la couche concernée.
- **En revue** : cite l'identifiant (`TENETS-REPO-005`) et applique la section
  « Vérification en revue » de la règle.
- **Écart volontaire** : interdit sans ADR dans `docs/adr/`.
- Les règles R1 à R15 de l'ADR-0003 complètent celles-ci ; en cas de conflit,
  l'ADR le plus récent l'emporte.

## Conventions de nommage (résumé)

- Vocabulaire **métier en français** : `Centre`, `Collecte`, `archiver()`, `demarrer()`.
- Vocabulaire **technique en anglais** : suffixes `UseCase`, `Repository`,
  `Port`, `Controller` ; méthodes `execute`, `get`, `save`, `search`, `run`, `commit`.
- Création : `Centre.creer(...)` ; reconstitution : `Centre.reconstituer(...)`.

## Carte des règles

| Fichier                         | Règles                                         | Sujet                                             |
| ------------------------------- | ---------------------------------------------- | ------------------------------------------------- |
| `01-dependances-composition.md` | DEPEND-001..003, COMPOSE-001..002, PORT-004    | Sens des dépendances, composition root            |
| `02-ports.md`                   | PORT-001..003, PORT-005..011, PATTERN-001..002 | Ports primaires et secondaires, types sémantiques |
| `03-adapters-api.md`            | ADAPTER-001..007, API-001..003, VALIDATE-002   | Controllers, DTO, adapters secondaires            |
| `04-entites-valeurs.md`         | ENTITY-001..002, VALUE-001..003, VALIDATE-001  | Entités, value objects, invariants                |
| `05-agregats-services.md`       | AGGREGATE-001..007, SERVICE-001..002           | Agrégats, services de domaine                     |
| `06-creation-reconstitution.md` | LIFECYCLE-001..006, APP-004, PATTERN-003       | `creer()` vs `reconstituer()`                     |
| `07-repositories.md`            | REPO-001..007                                  | Contrats et adapters de repository                |
| `08-use-cases.md`               | APP-001..003, APP-005..007                     | Orchestration applicative                         |
| `09-unit-of-work.md`            | UOW-001..011, PATTERN-005..006                 | Transactions Prisma, portée requête               |
| `10-contextes.md`               | CONTEXT-001..006, PATTERN-004                  | Bounded contexts et contrats publiés              |
| `11-evenements.md`              | EVENT-001..003                                 | Événements de domaine                             |
| `12-erreurs.md`                 | ERROR-001..008, PATTERN-012                    | Erreurs par couche, filtres NestJS                |
| `13-nommage.md`                 | NAME-001..005                                  | Langage ubiquitaire, suffixes                     |
| `14-tests.md`                   | TEST-001..006, PATTERN-011                     | TDD, fakes, tests de contrat                      |
| `15-structure.md`               | PATTERN-013                                    | Structure Nx par contexte                         |

## Les 12 réflexes à ne jamais oublier

1. `domain` et `application` n'importent jamais NestJS, Prisma ou Express (DEPEND-001/002).
2. Les ports sont des `abstract class` ; le câblage se fait dans un module NestJS (COMPOSE-001).
3. Un controller traduit puis appelle **un** use case, sans logique métier (ADAPTER-001).
4. Pas de chaîne brute à un port : `CentreId`, pas `string` (PORT-007, APP-005).
5. Un repository renvoie l'agrégat ou `null` ; `get`, jamais `find` (REPO-004/005).
6. `Centre.creer()` pour un nouvel objet, `Centre.reconstituer()` depuis la base (LIFECYCLE-001).
7. Les invariants vivent dans le domaine, y compris à la reconstitution (VALIDATE-001, VALUE-003).
8. Un use case = un workflow, suffixe `UseCase` (APP-001, NAME-003).
9. Écriture = `unitOfWork.run()` + `commit()` explicite (UOW-003).
10. Chaque erreur est déclarée par sa couche ; l'adapter HTTP choisit le code (ERROR-001/006).
11. Un contexte n'importe pas l'intérieur d'un autre (CONTEXT-002).
12. Test d'abord ; domaine testé sans infrastructure (TEST-001).
