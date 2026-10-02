---
paths:
  - 'libs/**/*'
  - 'apps/**/*'
---

# Structure du workspace Nx

## TENETS-PATTERN-013 — Structure par bounded context (réécrit pour Nx + NestJS)

`pragmatic` · guide

**But.** Rendre visibles la propriété de chaque contexte, le sens des
dépendances, l'emplacement des ports et la technologie des adapters, sans faire
des noms de dossiers ou du nombre de classes des règles d'architecture.

```text
apps/
  api/                                   composition root NestJS (layer:composition)
    src/main.ts, app.module.ts, erreur-inattendue.filter.ts
  api-e2e/                               tests HTTP boîte noire (type:e2e)
libs/
  shared-kernel/                         (context:shared-kernel) : strict minimum
    domain/                              créé au premier partage réel (ex. Email utilisé par 2 contextes)
    application/                         ports techniques communs : UnitOfWork, Clock
    adapters/                            PrismaService, PrismaTransaction, PrismaUnitOfWork, SystemClock
  referentiel/                           (context:referentiel)
    domain/src/
      centre/
        centre.ts                        agrégat + creer() / reconstituer()
        centre-id.ts, statut-centre.ts   value objects du concept (erreurs dans le même fichier)
        centre.errors.ts                 erreurs métier de l'agrégat
        centre.spec.ts
      commun/
        nom.ts, adresse.ts…              value objects partagés du contexte, avec leurs erreurs
      ports/
        centre.repository.ts             port du repository (abstract class)
        centre.repository.contrat.test-utils.ts   suite de contrat réutilisable (hors build)
      index.ts                           API publique de la lib
    application/src/                     un dossier par agrégat (convention RDC v2)
      centre/
        commandes.ts                     commandes des use cases du centre
        creer-centre.use-case.ts (+ .spec.ts)   écriture : unitOfWork.run + commit
      magasin/
        commandes.ts
        creer-magasin.use-case.ts (+ .spec.ts)
        lectures/lister-magasins.query.ts       lecture seule, sans unité de travail
      errors.ts                          CentreIntrouvable… (communes au contexte)
      ports/stockage-images.ts           port applicatif + ses erreurs
      testing/                           fakes partagés (*.test-utils.ts)
      index.ts                           API publique, regroupée par agrégat
    adapters/src/                        (layer:adapters), créée au premier besoin
      http/centre.controller.ts, centre.requete.ts, centre.reponse.ts, referentiel-http-error.filter.ts
      prisma/prisma-centre.repository.ts, centre.mapper.ts
      referentiel.module.ts              module NestJS du contexte (câblage)
  collecte/ …                            même découpage
```

Principes :

- Un fichier = un concept cohérent (type principal, ses value objects proches,
  ses erreurs), pas « une classe par fichier ».
- `index.ts` ne fait que réexporter l'API publique ; aucune logique dedans.
- Modèles Prisma, clients et mappers restent dans l'adapter qui les possède.
- Ports de repository : avec le modèle du domaine. Ports de capacités externes :
  avec le workflow applicatif qui les consomme.
- Couche application rangée **par agrégat** : un use case va dans le dossier de
  l'agrégat qu'il modifie, même s'il en lit un autre (`CreerMagasinUseCase`
  lit le centre, il est dans `magasin/`). Écriture : `*.use-case.ts` ; lecture
  sans modification : `*.query.ts` dans `lectures/`.
- Câblage : dans le module NestJS du contexte (`<contexte>.module.ts`),
  importé par `apps/api/src/app.module.ts`.
- Le `shared-kernel` reste minuscule : tout ajout y est discuté en revue (un
  noyau partagé qui grossit recrée le couplage que les contextes évitent).

Outils de test partagés (suites de contrat, fakes) :

- fichiers `*.test-utils.ts` : exclus du build, inclus dans les tests, non
  soumis à la règle « pas d'horloge » ;
- jamais exportés par `index.ts` (API de production) ;
- exposés aux autres libs par un point d'entrée dédié `src/testing.test-utils.ts`,
  importé via l'alias `@rdc/<contexte>-<couche>/testing` (déclaré dans
  `tsconfig.base.json`). Exemple : `@rdc/referentiel-domain/testing`.

Chaque nouveau contexte demande :

1. ses libs, générées avec leurs tags :
   ```bash
   pnpm nx g @nx/js:library libs/<contexte>/domain --name=<contexte>-domain \
     --importPath=@rdc/<contexte>-domain --bundler=none --unitTestRunner=jest \
     --tags=context:<contexte>,layer:domain
   ```
2. `pureLayerRules` dans l'`eslint.config.mjs` des libs `domain` et `application` ;
3. une contrainte `context:<contexte>` dans `eslint.config.mjs` à la racine.

Une revue d'architecture signale un **vrai** problème de propriété ou de
dépendance, pas une simple différence d'organisation cohérente.
