---
paths:
  - 'libs/**/*.ts'
  - 'apps/**/*.ts'
---

# Nommage

## Convention de langue RDC v2

| Élément                              | Langue        | Exemples                                                                  |
| ------------------------------------ | ------------- | ------------------------------------------------------------------------- |
| Concepts, méthodes et erreurs métier | Français      | `Collecte`, `demarrer()`, `CentreArchive`                                 |
| Suffixes de rôle                     | Anglais       | `UseCase`, `Repository`, `Controller`, `Module`, `Filter`                 |
| Verbes techniques standards          | Anglais       | `execute`, `get`, `save`, `list…`, `search`, `existsBy…`, `run`, `commit` |
| Fichiers                             | kebab-case    | `demarrer-collecte.use-case.ts`, `centre.repository.ts`                   |
| Mappers                              | `vers<Cible>` | `versCentre(ligne)`, `versCentreReponse(centre)`                          |

## TENETS-NAME-001 — Les noms du domaine suivent le langage ubiquitaire

`pragmatic` · avertissement

**Règle.** Les noms du modèle, des use cases, des ports, des événements et des
tests utilisent la terminologie convenue pour leur contexte.

**Pourquoi.** Un langage cohérent fait parler le code métier et révèle les désaccords conceptuels.

```ts
// ❌ Incorrect
export class TraitementDonneesService {}

// ✅ Correct
export class ApprouverClotureCollecteUseCase {}
```

**Correction.** Remplacer les termes génériques par le vocabulaire métier accepté
(voir `docs/domaine/glossaire.md` une fois écrit).

**Vérification en revue.** Comparer les noms du code avec le glossaire et les exemples métier.

## TENETS-NAME-002 — Les noms du domaine excluent technologie et fournisseurs

`pragmatic` · erreur

**Règle.** Types, comportements et événements du domaine sont nommés selon le
sens métier, jamais selon une base de données, un transport, un framework, un
fournisseur ou un mécanisme.

**Pourquoi.** Un nom technique dans le domaine y fait entrer un choix remplaçable.

```ts
// ❌ Incorrect
class PrismaCentre {}
class ImageNginxPubliee {}

// ✅ Correct
class Centre {}
class ImageMagasinPubliee {}
```

**Correction.** Déplacer les noms techniques dans les adapters et renommer les concepts selon leur sens.

**Vérification en revue.** Aucun nom de fournisseur, protocole, framework, base, file ou format dans le domaine.

## TENETS-NAME-003 — Les classes de use case finissent par `UseCase`

`pragmatic` · avertissement

**Règle.** Nommer un use case par sa capacité métier suivie du suffixe `UseCase`.

**Pourquoi.** Le suffixe distingue l'orchestration des services de domaine, adapters, handlers et commandes.

```ts
// ❌ Incorrect
export class DemarrerCollecte {}

// ✅ Correct
export class DemarrerCollecteUseCase {}
```

**Correction.** Renommer la classe et ses références dans les modules.

**Vérification en revue.** Chaque workflow applicatif finit par `UseCase` (fichier `*.use-case.ts`).

## TENETS-NAME-004 — Les handlers d'événements indiquent leur frontière

`pragmatic` · avertissement

**Règle.** Suffixer `DomainEventHandler` les handlers d'événements de domaine et
`IntegrationEventHandler` les consommateurs d'événements d'intégration.

**Pourquoi.** Des suffixes explicites lèvent l'ambiguïté quand les deux sortes d'événements coexistent.

```ts
// ❌ Incorrect
export class NotifierDemarrage {}

// ✅ Correct
export class PreparerSaisiesAuDemarrageDomainEventHandler {}
```

**Correction.** Renommer les handlers avec leur capacité et leur suffixe de frontière.

**Vérification en revue.** Un handler se reconnaît par son nom, sans dépendre de son dossier.

## TENETS-NAME-005 — Les noms de dépendance identifient leur capacité

`pragmatic` · avertissement

**Règle.** Nommer les dépendances injectées et champs selon leur capacité
précise. Éviter `repository`, `service`, `client`, `factory`, `handler`.

**Pourquoi.** Des noms précis gardent constructeurs et orchestration lisibles
quand plusieurs dépendances ont le même rôle technique.

```ts
// ❌ Incorrect
constructor(private readonly repository: CentreRepository, private readonly service: StockageImages) {}

// ✅ Correct
constructor(private readonly centreRepository: CentreRepository, private readonly stockageImages: StockageImages) {}
```

**Correction.** Renommer paramètres et champs selon la capacité qu'ils fournissent.

**Vérification en revue.** Chaque nom de dépendance reste clair sans lire son type.
