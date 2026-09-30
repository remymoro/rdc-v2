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
    domain/                              value objects vraiment transverses (Email, Telephone…)
    application/                         ports techniques : UnitOfWork, Clock, GenerateurIdentifiants
    adapters/                            PrismaService, PrismaTransaction, PrismaUnitOfWork, SystemClock
  referentiel/                           (context:referentiel)
    domain/src/
      centre/
        centre.ts                        agrégat + creer() / reconstituer()
        centre-id.ts, statut-centre.ts   value objects du concept
        centre.errors.ts                 erreurs métier du concept
        centre.spec.ts
      ports/
        centre.repository.ts             port du repository (abstract class)
        centre.repository.contrat.test-utils.ts   suite de contrat réutilisable (hors build)
      index.ts                           API publique de la lib
    application/src/
      commands.ts
      errors.ts                          CentreIntrouvable…
      ports/stockage-images.ts           port applicatif + ses erreurs
      use-cases/creer-centre.use-case.ts (+ .spec.ts)
      index.ts
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
- Câblage : dans le module NestJS du contexte (`<contexte>.module.ts`),
  importé par `apps/api/src/app.module.ts`.
- Le `shared-kernel` reste minuscule : tout ajout y est discuté en revue (un
  noyau partagé qui grossit recrée le couplage que les contextes évitent).

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
