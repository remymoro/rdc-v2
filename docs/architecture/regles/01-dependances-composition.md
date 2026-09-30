---
paths:
  - 'libs/**/*.ts'
  - 'apps/api/src/**/*.ts'
---

# Dépendances et composition

Le sens des dépendances est **toujours vers l'intérieur** :
`adapters → application → domain`. Seul le composition root (les modules
NestJS) connaît à la fois les ports et leurs implémentations.

## TENETS-DEPEND-001 — Le domaine ne dépend d'aucun framework ni d'aucune infrastructure

`core` · erreur

**Règle.** Le code du domaine ne dépend que de la bibliothèque standard du
langage et de concepts du domaine. Il n'importe ni framework, ni ORM, ni
transport, ni SDK, ni configuration, ni workflow applicatif, ni adapter.

**Pourquoi.** Le modèle métier doit pouvoir s'exécuter et se tester sans choisir
d'infrastructure ni de mode de livraison.

```ts
// ❌ Incorrect — décorateurs d'infrastructure dans le domaine
import { Injectable } from '@nestjs/common';
import { Centre as CentreRow } from '@prisma/client';

@Injectable()
export class Centre {
  constructor(private readonly row: CentreRow) {}
}

// ✅ Correct — types du domaine uniquement
export class Centre {
  private constructor(
    readonly id: CentreId,
    private nom: Nom,
    private statut: StatutCentre,
  ) {}
}
```

**Correction.** Déplacer annotations et mapping techniques dans un adapter ; ne
garder que des types et comportements du domaine.

**Vérification en revue.** Aucun import d'application, d'adapter, de framework,
de persistance, de transport ou de SDK dans `libs/*/domain`. Vérifié par le lint
(`bannedExternalImports`, ADR-0003 R2).

## TENETS-DEPEND-002 — L'application dépend du domaine et de ses propres ports

`core` · erreur

**Règle.** Le code applicatif peut dépendre des concepts du domaine et des ports
possédés par le domaine ou l'application. Il n'importe jamais d'adapter concret,
de framework, de client externe ou d'implémentation de persistance.

**Pourquoi.** Les use cases restent indépendants des choix techniques
remplaçables quand leurs dépendances sont des contrats possédés à l'intérieur.

```ts
// ❌ Incorrect — adapter concret et décorateurs NestJS dans un use case
@Injectable()
export class ArchiverCentreUseCase {
  constructor(private readonly centres: PrismaCentreRepository) {}
}

// ✅ Correct — classe simple, dépendance vers un port
export class ArchiverCentreUseCase {
  constructor(
    private readonly centreRepository: CentreRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly clock: Clock,
  ) {}
}
```

**Correction.** Introduire ou utiliser un port possédé à l'intérieur ; déplacer
le choix de l'adapter dans le composition root.

**Vérification en revue.** Imports et types des constructeurs de
`libs/*/application` : aucun adapter concret ni paquet technique.

## TENETS-DEPEND-003 — Les adapters ne dépendent que des contrats publiés vers l'intérieur

`core` · erreur

**Règle.** Un adapter peut dépendre des ports qu'il appelle ou implémente, de
leurs types sémantiques, et des fabriques de reconstitution du domaine
nécessaires au mapping. Il n'importe ni les détails internes d'une autre couche,
ni un autre adapter.

**Pourquoi.** Les contrats publiés créent des frontières volontaires ; les
imports internes et les appels d'adapter à adapter créent un couplage caché.

```ts
// ❌ Incorrect — un controller qui appelle un repository Prisma
import { PrismaCentreRepository } from '../secondary/prisma/prisma-centre.repository';

// ✅ Correct — un controller qui dépend du use case
import { ArchiverCentreUseCase } from '@rdc/referentiel-application';
```

**Correction.** Remplacer la dépendance interne ou entre adapters par le contrat
publié concerné ; câbler les implémentations à l'extérieur.

**Vérification en revue.** Les imports d'un adapter se limitent aux contrats
implémentés ou appelés, à leurs types sémantiques et aux fabriques de mapping.

## TENETS-COMPOSE-001 — Le câblage des dépendances a lieu dans le composition root

`core` · erreur

**Règle.** Le choix des adapters concrets, leur construction, leur portée de vie
(`Scope`) et l'association port → adapter se font dans un composition root
externe. Dans RDC v2 : les **modules NestJS** (`*.module.ts`).

**Pourquoi.** Seul le composition root a besoin de connaître à la fois les
contrats et leurs implémentations.

```ts
// ❌ Incorrect — le use case construit lui-même son adapter
export class CreerCentreUseCase {
  private readonly centreRepository = new PrismaCentreRepository(new PrismaClient());
}

// ✅ Correct — le module câble ports et adapters
@Module({
  providers: [
    { provide: CentreRepository, useClass: PrismaCentreRepository },
    {
      provide: CreerCentreUseCase,
      useFactory: (centres: CentreRepository, uow: UnitOfWork, clock: Clock) => new CreerCentreUseCase(centres, uow, clock),
      inject: [CentreRepository, UnitOfWork, Clock],
    },
  ],
})
export class ReferentielModule {}
```

**Correction.** Sortir construction et sélection d'adapters des use cases, du
domaine et des adapters, vers les modules NestJS.

**Vérification en revue.** Aucun `new PrismaClient()`, `process.env`, service
locator (`moduleRef.get`) ni choix d'implémentation dans les couches internes.

## TENETS-COMPOSE-002 — La configuration technique reste hors de la logique métier

`core` · erreur

**Règle.** Variables d'environnement, connexions, secrets, choix de fournisseur,
configuration du framework et déploiement restent dans la configuration et les
modules de composition.

**Pourquoi.** Le comportement métier ne doit pas changer selon la façon dont le
service est déployé ou l'adapter choisi.

```ts
// ❌ Incorrect — le domaine lit l'environnement
if (process.env.STOCKAGE_IMAGES === 'local') { magasin.marquerImageLocale(); }

// ✅ Correct — la configuration choisit l'adapter
{ provide: StockageImages, useFactory: (config: ConfigService) =>
    new DisqueStockageImages(config.getOrThrow('UPLOADS_DIR')), inject: [ConfigService] }
```

**Correction.** Déplacer ces décisions dans une configuration typée et le
composition root.

**Vérification en revue.** Aucun accès à `process.env`, secret, chaîne de
connexion ni branche par fournisseur dans `domain` et `application`.

## TENETS-PORT-004 — Les dépendances externes passent par des ports

`core` · erreur

**Règle.** Les workflows applicatifs accèdent à la persistance, la messagerie,
les services externes, **l'horloge**, **la génération d'identifiants** et toute
capacité externe remplaçable via des ports possédés à l'intérieur.

**Pourquoi.** Les ports isolent le métier de la technologie et donnent des
frontières de test explicites.

```ts
// ❌ Incorrect
const maintenant = new Date();
const id = randomUUID();

// ✅ Correct
const maintenant = this.clock.now();
const id = this.generateurIdentifiants.nouveauCentreId();
```

**Correction.** Définir la capacité ciblée, l'implémenter dans un adapter et
l'injecter dans le use case.

**Vérification en revue.** Pas d'I/O ni d'appel à une bibliothèque externe dans
`domain` et `application` ; `new Date()` et `Date.now()` sont bloqués par le lint
(ADR-0003 R3).
