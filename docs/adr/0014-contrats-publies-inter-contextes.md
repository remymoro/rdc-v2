# ADR-0014 — Contrats publiés entre bounded contexts

- **Statut :** proposé
- **Date :** 2026-10-01

## Contexte

La vérification des magasins est le premier workflow v2 qui exige une lecture
synchrone entre deux contextes. `collecte` doit connaître les magasins et
centres actifs de `referentiel`; `referentiel`, `planification`, `saisie` et
`identite-acces` doivent interroger des décisions possédées par `collecte`.

Un import d'un repository, d'un agrégat ou d'un use case interne violerait
ADR-0003 R1 et TENETS-CONTEXT-002. Les règles TENETS-CONTEXT-003 à 006 demandent
un contrat fournisseur, un port dans le langage consommateur et un adapter de
traduction. Le workspace n'a pas encore de bibliothèque publiée ni de règle
Nx qui autorise cet unique passage entre contextes.

## Décision proposée

1. Un contexte peut publier une bibliothèque `libs/<contexte>/contrat`, taguée
   `context:<contexte>,layer:published,scope:published`. Elle contient uniquement
   des types de transport en primitives et une façade applicative abstraite.
   Elle n'exporte aucun objet du domaine, repository ou use case interne.
2. La façade est implémentée et câblée par `libs/<contexte>/adapters`. Le
   contexte fournisseur reste propriétaire du calcul de ses réponses.
3. Le consommateur définit un port dans son propre langage, dans `domain` ou
   `application` selon TENETS-CONTEXT-005. Un adapter du consommateur importe la
   bibliothèque publiée et traduit ses types. Aucun autre projet consommateur
   ne l'importe.
4. Les contraintes Nx ajoutent `layer:published` aux cibles permises de
   `layer:adapters` et `layer:composition`, jamais à celles de `layer:domain` ou
   `layer:application`. Chaque contexte consommateur ajoute `scope:published`
   à ses cibles permises : il peut ainsi atteindre le seul contrat public d'un
   autre contexte, jamais ses couches internes. La bibliothèque publiée ne peut
   elle-même dépendre que de `layer:published` et, si un partage de primitives
   est réellement nécessaire, du `shared-kernel`.
5. Les premières façades sont `ReferentielPublic` et `CollectePublique`, dont
   les signatures sont spécifiées dans `docs/design/collecte.md`.
6. Les contrats publiés sont testés comme des APIs : test de type/compilation,
   test de traduction dans l'adapter consommateur et tests d'intégration de
   l'implémentation fournisseur.

## Conséquences

- La dépendance technique va de l'adapter consommateur vers le contrat publié
  du fournisseur ; le domaine et l'application restent indépendants.
- Une représentation peut être dupliquée de part et d'autre de la frontière :
  cette traduction explicite protège le langage de chaque contexte.
- Modifier une signature publiée demande une migration compatible des
  consommateurs ou une nouvelle version du contrat.
- Les façades sont synchrones et locales au monorepo. Un passage futur à HTTP
  ou à la messagerie ne change pas les ports consommateurs.
- La création effective des bibliothèques et de la contrainte ESLint appartient
  au premier lot de code qui consomme chaque contrat, pas à ce lot documentaire.

Cette décision s'écarte de la v1, où les use cases et repositories d'un modèle
global étaient importés directement. Elle applique TENETS-CONTEXT-002 à 006.
