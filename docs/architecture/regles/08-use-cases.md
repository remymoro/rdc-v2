---
paths:
  - 'libs/*/application/**/*.ts'
---

# Use cases

Un use case est une **classe TypeScript simple**, sans `@Injectable()`, avec une
méthode `execute()`. Il est câblé par `useFactory` dans le module NestJS
(TENETS-COMPOSE-001).

## TENETS-APP-001 — Un use case représente un workflow

`core` · erreur

**Règle.** Un use case représente un workflow métier nommé et expose un point
d'entrée applicatif clair.

**Pourquoi.** Des use cases ciblés restent compréhensibles, testables
isolément et alignés sur le langage métier.

```ts
// ❌ Incorrect
export class CollecteService {
  creerModifierDemarrerEtCloturer(donnees: unknown) {}
}

// ✅ Correct
export class DemarrerCollecteUseCase {
  async execute(commande: DemarrerCollecteCommande): Promise<Collecte> {
    /* … */
  }
}
```

**Correction.** Séparer les workflows sans rapport en use cases distincts.

**Vérification en revue.** Nom, entrée, dépendances et transaction servent un seul résultat métier.

## TENETS-APP-002 — Les use cases orchestrent le comportement du domaine

`core` · erreur

**Règle.** Un use case charge l'état, coordonne dépendances et transaction,
appelle le comportement du domaine et interprète le résultat du workflow. Les
invariants et calculs métier restent dans le domaine.

**Pourquoi.** L'orchestration change pour des raisons de workflow ; les règles
métier pour des raisons métier.

```ts
// ❌ Incorrect — règle métier dans le use case
if (collecte.statut === StatutCollecte.PREPARATION && maintenant >= collecte.periode.debut) {
  collecte['statut'] = StatutCollecte.EN_COURS;
}

// ✅ Correct
collecte.demarrer(maintenant);
```

**Correction.** Déplacer la décision dans le concept du domaine qui possède
l'invariant ; ne garder que la coordination.

**Vérification en revue.** Aucun calcul, affectation d'état ni condition métier dans un use case.

## TENETS-APP-003 — Le use case charge l'état requis par une capacité sortante

`core` · erreur

**Règle.** Le use case charge chaque agrégat, entité ou valeur nécessaire à une
capacité secondaire **avant** d'appeler ce port.

**Pourquoi.** Charger fait partie de l'orchestration ; le garder dans le use case
évite des accès cachés à la persistance dans les adapters.

```ts
// ❌ Incorrect
await this.exportPlanning.exporter(collecteId);

// ✅ Correct
const collecte = await this.collecteRepository.get(requete.collecteId);
const slots = await this.slotRepository.listByCollecte(requete.collecteId);
await this.exportPlanning.exporter(new PlanningAExporter(collecte!, slots));
```

**Correction.** Déplacer les chargements de l'adapter vers le use case et fournir une entrée sémantique complète.

**Vérification en revue.** Aucun adapter ne reçoit un identifiant qui lui sert à charger d'autres états du domaine.

## TENETS-APP-005 — Les use cases créent les types sémantiques de frontière

`pragmatic` · erreur

**Règle.** Avant d'appeler un repository ou un port secondaire, les primitives
d'une commande sont converties en identifiants, value objects, critères nommés
ou contrats de capacité.

**Pourquoi.** Les primitives sont acceptables à la frontière de transport, pas
sur les contrats sémantiques internes.

```ts
// ❌ Incorrect
const centre = await this.centreRepository.get(commande.centreId as never);

// ✅ Correct — la commande porte déjà un CentreId, construit par l'adapter HTTP
export interface ArchiverCentreCommande {
  readonly centreId: CentreId;
}
```

**Correction.** Faire la conversion à l'entrée du use case (ou, convention RDC v2,
dans l'adapter primaire qui construit la commande : ADR-0003 R8).

**Vérification en revue.** Suivre chaque champ de commande jusqu'aux appels
sortants : aucune primitive porteuse de sens.

## TENETS-APP-006 — Le use case possède la coordination transactionnelle

`core` · erreur

**Règle.** Le use case définit la portée de la transaction et coordonne les
événements, l'outbox et le moment des appels sortants. Ni le domaine ni les
adapters ne possèdent la transaction métier.

**Pourquoi.** L'application connaît la frontière du workflow et coordonne la
persistance sans coupler le domaine à l'infrastructure.

```ts
// ❌ Incorrect
export class PrismaCollecteRepository {
  async sauverEtNotifierEtExporter(collecte: Collecte) {
    /* … */
  }
}

// ✅ Correct
await this.unitOfWork.run(async () => {
  await this.collecteRepository.save(collecte);
  await this.unitOfWork.commit();
});
```

**Correction.** Déplacer la coordination transactionnelle dans le use case.

**Vérification en revue.** Commits, publications et enchaînements multi-capacités appartiennent à l'application.

## TENETS-APP-007 — Les use cases renvoient un résultat significatif possédé à l'intérieur

`core` · erreur

**Règle.** Un use case renvoie le contrat le plus simple et significatif :
`void`, un objet du domaine ou un résultat applicatif immuable. Jamais un modèle
Prisma, un DTO d'adapter, un type de framework ni un objet non typé.

**Pourquoi.** Un résultat naturel du domaine n'a pas besoin d'enveloppe ; une
projection ou un résultat combiné mérite un type applicatif stable.

```ts
// ❌ Incorrect
return { centre }; // enveloppe sans sens
return this.prisma.centre.findMany(); // modèle de persistance

// ✅ Correct
return centre;
return new SyntheseCentre(centre.id, poidsTotal, nombreCollectes);
```

**Correction.** Renvoyer directement l'objet du domaine s'il est le résultat
naturel, sinon définir un résultat applicatif immuable.

**Vérification en revue.** Contester les enveloppes qui ne contiennent qu'un objet du domaine.
