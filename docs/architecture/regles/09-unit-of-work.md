---
paths:
  - 'libs/*/application/**/*.ts'
  - 'libs/*/adapters/**/*.ts'
  - 'apps/api/src/**/*.ts'
---

# Unit of Work (transactions)

Contrat applicatif retenu dans RDC v2 :

```ts
// libs/shared-kernel/application/src/ports/unit-of-work.ts
export abstract class UnitOfWork {
  /** Exécute `travail` dans une transaction. Sans commit(), tout est annulé.
   *  Une instance représente une seule transaction. */
  abstract run<T>(travail: () => Promise<T>): Promise<T>;
  /** Dernière instruction d'un travail réussi. */
  abstract commit(): Promise<void>;
}
```

## TENETS-UOW-001 — L'application possède le contrat de Unit of Work

`core` · erreur

**Règle.** La Unit of Work est un port possédé par l'application. Les adapters
de persistance implémentent la mécanique transactionnelle sans exposer vers
l'intérieur ni client Prisma, ni `Prisma.TransactionClient`, ni SQL.

**Pourquoi.** Le use case décide quand le travail réussit ; l'infrastructure
décide comment la transaction technique valide, annule et libère ses ressources.

```ts
// ❌ Incorrect
export class CreerCentreUseCase {
  constructor(private readonly prisma: PrismaClient) {}
}

// ✅ Correct
export class CreerCentreUseCase {
  constructor(
    private readonly centreRepository: CentreRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}
}
```

**Correction.** Placer le contrat dans l'application ; garder les ressources du
pilote dans les adapters secondaires.

**Vérification en revue.** Aucun use case n'importe un type transactionnel de persistance.

> **Écart avec RDC v1.** Le port `IUnitOfWork` vivait dans `libs/domain`. Il
> appartient à l'application.

## TENETS-UOW-002 — Une instance de Unit of Work = une transaction

`core` · erreur

**Règle.** Chaque instance est une frontière transactionnelle à usage unique. Ne
pas la réutiliser après sa fin.

**Pourquoi.** Un cycle de vie unique empêche l'état transactionnel de passer d'une opération à l'autre.

```ts
// ❌ Incorrect
await this.unitOfWork.run(async () => {
  /* … */ await this.unitOfWork.commit();
});
await this.unitOfWork.run(async () => {
  /* … */ await this.unitOfWork.commit();
});

// ✅ Correct — une nouvelle instance par transaction voulue (voir UOW-007)
const premiere = this.fabriqueTransactions.creer();
await premiere.unitOfWork.run(/* … */);
const seconde = this.fabriqueTransactions.creer();
await seconde.unitOfWork.run(/* … */);
```

**Correction.** Créer une Unit of Work par transaction et refuser explicitement la réutilisation dans l'adapter.

**Vérification en revue.** Chaque instance n'est utilisée qu'une fois.

## TENETS-UOW-003 — Une écriture réussie exige un commit explicite

`core` · erreur

**Règle.** Un use case qui écrit appelle `commit()` après toutes les
modifications requises. Une exception ou une sortie sans commit annule tout.

**Pourquoi.** Un commit explicite rend visible la frontière de succès ; un oubli
ou un retour anticipé échoue en sécurité.

```ts
// ❌ Incorrect — validation implicite
await this.unitOfWork.run(async () => {
  await this.centreRepository.save(centre);
});

// ✅ Correct
await this.unitOfWork.run(async () => {
  await this.centreRepository.save(centre);
  await this.unitOfWork.commit();
});
```

**Correction.** Supprimer toute validation implicite, ajouter le commit explicite,
annuler toute sortie incomplète.

**Vérification en revue.** Chaque chemin d'écriture valide exactement une fois, après tout le travail transactionnel.

## TENETS-UOW-004 — Les participants partagent une ressource, sans dépendance cachée

`core` · erreur

**Règle.** Le composition root donne à chaque repository et à la Unit of Work
d'une même transaction la **même** ressource transactionnelle, tout en injectant
chaque port explicitement.

**Pourquoi.** L'atomicité exige un état transactionnel partagé ; des dépendances
explicites évitent que la Unit of Work devienne un service locator.

```ts
// ❌ Incorrect
await this.unitOfWork.run(async () => {
  const centre = await this.unitOfWork.repositories.centres.get(id);
});

// ✅ Correct — PrismaTransaction (Scope.REQUEST) partagée par le module
{ provide: CentreRepository, useClass: PrismaCentreRepository, scope: Scope.REQUEST },
{ provide: UnitOfWork, useClass: PrismaUnitOfWork, scope: Scope.REQUEST },
```

**Correction.** Organiser le partage de la ressource dans le module et injecter
chaque port par son nom de capacité.

**Vérification en revue.** Les participants partagent bien une ressource, et
aucune dépendance n'est découverte via la Unit of Work.

## TENETS-UOW-005 — L'adapter libère les ressources transactionnelles

`core` · erreur

**Règle.** L'adapter annule le travail incomplet et libère sa ressource sur
**tous** les chemins de sortie.

**Pourquoi.** Un commit seul ne libère pas la connexion ; un nettoyage
déterministe évite fuites et état transactionnel résiduel.

```ts
// ❌ Incorrect — le client transactionnel reste attaché après erreur
this.transaction.ouvrir(tx);
return await travail();

// ✅ Correct
try {
  await this.prisma.$transaction(async (tx) => {
    this.transaction.ouvrir(tx); /* … */
  });
} finally {
  this.transaction.fermer();
}
```

**Correction.** Ajouter l'annulation en cas de sortie incomplète et un nettoyage
inconditionnel, puis tester succès et échec.

**Vérification en revue.** Commit, échec applicatif, échec de commit et retour
anticipé libèrent tous la ressource.

## TENETS-UOW-006 — Une Unit of Work n'orchestre pas de workflow

`pragmatic` · erreur

**Règle.** La Unit of Work ne gère que la mécanique transactionnelle. Elle ne
charge pas d'agrégat, n'applique pas de règle métier, ne publie pas
d'événement, ne construit pas d'adapter et ne lit pas de configuration.

**Pourquoi.** Mettre du comportement applicatif dans l'infrastructure
transactionnelle cache les dépendances.

```ts
// ❌ Incorrect
await this.unitOfWork.demarrerCollecteEtNotifier(collecteId);

// ✅ Correct
await this.unitOfWork.run(async () => {
  const collecte = await this.collecteRepository.get(commande.collecteId);
  collecte!.demarrer(this.clock.now());
  await this.collecteRepository.save(collecte!);
  await this.unitOfWork.commit();
});
```

**Correction.** Ne laisser dans l'adapter que début, commit, annulation et nettoyage.

**Vérification en revue.** Les méthodes de l'adapter ne font rien d'autre que de la mécanique transactionnelle.

## TENETS-UOW-007 — Un workflow multi-transactions crée des transactions neuves

`pragmatic` · erreur

**Règle.** Un workflow qui franchit volontairement plusieurs frontières
transactionnelles obtient une Unit of Work neuve (et ses adapters) pour chacune,
via une fabrique propre à la capacité.

**Pourquoi.** Il ne faut ni réutiliser une ressource fermée, ni garder une
transaction ouverte pendant un appel externe.

```ts
// ❌ Incorrect — la tâche cron boucle avec une seule Unit of Work
for (const collecte of aDemarrer) {
  await this.unitOfWork.run(async () => {
    /* … */
  });
}

// ✅ Correct — une transaction neuve par collecte
for (const collecteId of aDemarrer) {
  const transaction = this.fabriqueTransactionsCycleDeVie.creer();
  await transaction.unitOfWork.run(async () => {
    /* … */
  });
}
```

**Correction.** Remplacer la Unit of Work réutilisée par une fabrique nommée qui
crée des dépendances correctement partagées.

**Vérification en revue.** Chaque transaction d'un workflow multi-transactions a sa propre Unit of Work et sa propre ressource.

## TENETS-UOW-008 — La Unit of Work ne rejoue pas les workflows

`pragmatic` · erreur

**Règle.** La Unit of Work ne rejoue jamais silencieusement le workflow entier.
C'est le use case ou la politique de l'adapter primaire qui décide si rejouer est sûr.

**Pourquoi.** Rejouer peut répéter comportement métier, lecture d'horloge,
génération d'identifiants et appels externes.

```ts
// ❌ Incorrect
async run(travail) { for (let i = 0; i < 3; i++) { try { return await this.essayer(travail); } catch {} } }

// ✅ Correct — la décision de rejouer est explicite, à l'extérieur
try { await this.demarrerCollecte.execute(commande); }
catch (e) { if (e instanceof ConflitVersionCollecte) await this.politiqueRejeu.traiter(commande); else throw e; }
```

**Correction.** Supprimer les rejeux cachés de l'infrastructure transactionnelle.

**Vérification en revue.** Aucune boucle de rejeu, ni décorateur `retry`, dans les adapters de Unit of Work.

## TENETS-UOW-009 — Pas de Unit of Work imbriquée

`pragmatic` · erreur

**Règle.** Ne pas imbriquer de Unit of Work. Un handler appelé dans une
transaction y participe via ses ports injectés et n'ouvre ni ne valide une autre
Unit of Work.

**Pourquoi.** L'imbrication rend ambiguë la propriété du commit. Avec Prisma, un
`$transaction` imbriqué ouvre une connexion distincte : il n'est **pas** atomique
avec l'extérieur.

```ts
// ❌ Incorrect
await this.unitOfWork.run(async () => {
  await this.autreUseCase.execute(commande); // ouvre sa propre Unit of Work
});

// ✅ Correct — un seul run(), les participants partagent la transaction
await this.unitOfWork.run(async () => {
  await this.collecteRepository.save(collecte);
  await this.saisieCentreRepository.save(saisie);
  await this.unitOfWork.commit();
});
```

**Correction.** Réutiliser les ports qui participent à la transaction ; un besoin
de savepoint devient une capacité explicite documentée par un ADR.

**Vérification en revue.** Aucun chemin d'appel dans un `run()` n'ouvre ni ne valide une autre Unit of Work.

## TENETS-UOW-010 — Un échec d'annulation ne masque pas l'échec principal

`pragmatic` · erreur

**Règle.** Si l'annulation échoue pendant un autre échec, conserver l'échec
d'origine et signaler l'échec d'annulation via l'observabilité. Si l'annulation
est le seul échec, lever un échec d'annulation précis avec sa cause.

**Pourquoi.** Remplacer l'échec principal détruit la raison de l'abandon ;
ignorer l'échec de nettoyage cache un état incertain.

```ts
// ❌ Incorrect
catch (erreur) { await this.annuler(); throw erreur; }   // si annuler() échoue, `erreur` est perdue

// ✅ Correct
catch (erreur) {
  try { await this.annuler(); }
  catch (erreurAnnulation) { this.logger.error('Échec d\'annulation', { erreurAnnulation, erreur }); }
  throw erreur;
}
```

**Correction.** Tester séparément l'annulation pendant un échec et l'annulation seule en échec.

**Vérification en revue.** Priorité des erreurs, chaînage des causes et observabilité de l'échec d'annulation.

> Avec `prisma.$transaction(callback)`, c'est Prisma qui exécute l'annulation ;
> l'adapter doit seulement relancer l'erreur d'origine sans l'envelopper.

## TENETS-UOW-011 — Les ressources de lecture ont une portée de nettoyage explicite

`pragmatic` · erreur

**Règle.** Utiliser une Unit of Work pour les lectures qui exigent un instantané
cohérent sur plusieurs requêtes. Une requête isolée peut utiliser le client
Prisma hors transaction, qui gère lui-même sa connexion.

**Pourquoi.** Une lecture consomme aussi des connexions, mais la cérémonie
transactionnelle est inutile pour une requête autonome.

```ts
// ❌ Incorrect — deux lectures qui doivent être cohérentes, hors transaction
const collecte = await this.collecteRepository.get(id);
const saisies = await this.saisieRepository.listByCollecte(id);

// ✅ Correct — instantané cohérent pour une clôture
await this.unitOfWork.run(async () => {
  /* lectures puis décision */
});
```

**Correction.** Choisir explicitement entre lecture transactionnelle et requête
autonome ; ne jamais ouvrir de client Prisma supplémentaire dans un adapter.

**Vérification en revue.** Chaque ressource de lecture a un propriétaire visible et un nettoyage borné.

## TENETS-PATTERN-006 — Unit of Work avec Prisma (réécrit pour NestJS)

`pragmatic` · guide

Prisma ne valide une transaction interactive qu'au **retour** du callback de
`$transaction`. L'adapter mémorise donc la demande de `commit()` et provoque une
annulation si le travail se termine sans elle.

```ts
// libs/shared-kernel/adapters/src/prisma/prisma-transaction.ts
@Injectable({ scope: Scope.REQUEST })
export class PrismaTransaction {
  private clientTransactionnel: Prisma.TransactionClient | null = null;
  constructor(private readonly prisma: PrismaService) {}

  /** Client à utiliser par les repositories : transactionnel pendant un run(). */
  get client(): Prisma.TransactionClient {
    return this.clientTransactionnel ?? this.prisma;
  }
  ouvrir(tx: Prisma.TransactionClient): void {
    this.clientTransactionnel = tx;
  }
  fermer(): void {
    this.clientTransactionnel = null;
  }
}

class TravailSansCommit extends Error {}

@Injectable({ scope: Scope.REQUEST })
export class PrismaUnitOfWork extends UnitOfWork {
  private utilisee = false;
  private commitDemande = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly transaction: PrismaTransaction,
  ) {
    super();
  }

  async run<T>(travail: () => Promise<T>): Promise<T> {
    if (this.utilisee) throw new Error('Une UnitOfWork ne peut pas être réutilisée (TENETS-UOW-002)');
    this.utilisee = true;
    let resultat!: T;
    try {
      await this.prisma.$transaction(async (tx) => {
        this.transaction.ouvrir(tx);
        resultat = await travail();
        if (!this.commitDemande) throw new TravailSansCommit(); // annulation (TENETS-UOW-003)
      });
    } catch (erreur) {
      if (!(erreur instanceof TravailSansCommit)) throw erreur; // l'erreur d'origine reste intacte
    } finally {
      this.transaction.fermer(); // TENETS-UOW-005
    }
    return resultat;
  }

  async commit(): Promise<void> {
    if (!this.utilisee || this.commitDemande) throw new Error('commit() invalide');
    this.commitDemande = true;
  }
}

// Un repository utilise toujours la ressource partagée
@Injectable({ scope: Scope.REQUEST })
export class PrismaCentreRepository extends CentreRepository {
  constructor(private readonly transaction: PrismaTransaction) {
    super();
  }
  async get(id: CentreId): Promise<Centre | null> {
    const ligne = await this.transaction.client.centre.findUnique({ where: { id: id.valeur } });
    return ligne === null ? null : versCentre(ligne);
  }
}
```

Tests d'intégration obligatoires sur PostgreSQL : commit, annulation sans
commit, annulation sur exception, non-réutilisation, atomicité entre deux
repositories.

## TENETS-PATTERN-005 — Portée par requête dans NestJS (remplace le pattern Flask)

`pragmatic` · guide

- **HTTP** : `PrismaTransaction`, les repositories, la Unit of Work et les use
  cases qui écrivent sont en `Scope.REQUEST`. Chaque requête HTTP obtient donc
  ses propres instances, sans partage d'état transactionnel.
- **Tâches cron et scripts** (pas de requête HTTP) : l'adapter primaire crée un
  contexte explicite par exécution :

```ts
@Injectable()
export class CycleDeVieCollecteTache {
  constructor(private readonly moduleRef: ModuleRef) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async executer(): Promise<void> {
    const contexte = ContextIdFactory.create(); // un contexte = une transaction
    const useCase = await this.moduleRef.resolve(DemarrerCollectesEchuesUseCase, contexte);
    await useCase.execute();
  }
}
```

`moduleRef.resolve` n'est autorisé que dans les adapters primaires et le
composition root, jamais dans `domain` ni `application`. Alternative possible
(`AsyncLocalStorage`, `nestjs-cls`) : uniquement via un ADR.
