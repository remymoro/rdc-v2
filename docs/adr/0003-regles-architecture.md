# ADR-0003 — Règles d'architecture (DDD + hexagonal, Tenets profil `pragmatic`)

- **Statut :** accepté
- **Date :** 2026-09-30

## Contexte

RDC v1 était déjà en DDD/hexagonal, mais plusieurs règles ne tenaient que par
la relecture (19 lectures d'horloge restées dans le domaine), d'autres
n'existaient pas (frontières entre contextes, tests du domaine en CI). Une règle
vérifiée par un outil vaut mieux qu'une règle écrite.

## Décision

### Vérifiées par les outils

| Règle  | Contenu                                                                                                                                                               | Vérification                                                      |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **R1** | Un contexte métier n'importe que lui-même et le `shared-kernel`                                                                                                       | `@nx/enforce-module-boundaries`, tags `context:*`                 |
| **R2** | `domain` et `application` n'importent ni NestJS, ni Prisma, ni Express, ni rxjs… Les ports sont des `abstract class` (jeton d'injection), jamais des jetons en chaîne | `bannedExternalImports` + tags `layer:*`                          |
| **R3** | `domain` et `application` ne lisent jamais l'horloge : `now: Date` en paramètre ou port `Clock`                                                                       | `no-restricted-syntax` (`new Date()` sans argument, `Date.now()`) |
| **R4** | La CI exécute formatage, lint, vérification des types (`typecheck`), tests et build des projets touchés, plus `pnpm audit` (bloquant dès `high`)                      | `.github/workflows/ci.yml`                                        |
| **R5** | Aucun fichier de plus de 500 lignes utiles                                                                                                                            | `max-lines`                                                       |

### Portées par le TDD et la relecture

| Règle   | Contenu                                                                                                                                                                                                                                 |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R6**  | Chaque couche possède ses erreurs : erreurs métier dans `domain`, erreurs de déroulement dans `application`, choix du code HTTP dans l'adapter. Pas de hiérarchie globale `DomainException`. Codes d'erreur stables (`CENTRE_ARCHIVED`) |
| **R7**  | Un repository renvoie `null` si absent ; verbes `get`, `getBy…`, `list…`, `search`, `existsBy…`, jamais `find`                                                                                                                          |
| **R8**  | Les use cases reçoivent des types métier (value objects), pas des chaînes brutes                                                                                                                                                        |
| **R9**  | La reconstitution depuis la base valide les invariants de structure (pas les règles propres à la création) ; une donnée historique invalide se corrige par migration                                                                    |
| **R10** | Chaque repository Prisma passe la même suite de tests de contrat que sa version en mémoire                                                                                                                                              |
| **R11** | Le rôle est vérifié par un seul guard ; le périmètre (« mon centre ») est une règle applicative testée. Chaque route protégée a un test « refusé »                                                                                      |

### Fonctionnement

| Règle   | Contenu                                                                                                                                                                                                         |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R12** | Toute décision importante a son ADR dans `docs/adr/`                                                                                                                                                            |
| **R13** | Pas d'événement de domaine sans consommateur ; l'outbox transactionnelle arrive avec le premier besoin réel                                                                                                     |
| **R14** | Les statistiques sont un modèle de lecture séparé, qui ne modifie jamais rien                                                                                                                                   |
| **R15** | Les règles Tenets du profil `pragmatic`, adaptées à NestJS dans `docs/architecture/regles/`, font référence. Toute revue d'architecture cite leurs identifiants `TENETS-XXX-NNN` avant chaque fusion (ADR-0005) |

### Structure

```text
apps/api                       composition root NestJS (tags type:app, layer:composition)
apps/api-e2e                   tests boîte noire HTTP (tag type:e2e)
libs/<contexte>/domain         TypeScript pur (layer:domain)
libs/<contexte>/application    use cases + ports (layer:application)
libs/<contexte>/adapters       HTTP, Prisma… (layer:adapters) — créée au premier besoin
```

Écarts assumés par rapport à Tenets : fabriques statiques `Centre.creer()` /
`Centre.reconstituer()` plutôt que des fonctions `createCentre()` (idiomatique
en TypeScript, admis par Tenets hors Python) ; profil `pragmatic`, pas `strict`.

## Conséquences

- Nouveau contexte = nouvelles libs avec leurs tags **et** une ligne
  `context:<nom>` dans `eslint.config.mjs`.
- Les libs `domain` et `application` importent `pureLayerRules` dans leur
  `eslint.config.mjs`.
- Seuil `max-lines` : une seule sévérité possible par règle ESLint ; la cible de
  300 lignes reste une consigne de relecture.
