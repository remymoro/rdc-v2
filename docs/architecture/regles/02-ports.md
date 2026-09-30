---
paths:
  - 'libs/*/domain/**/*.ts'
  - 'libs/*/application/**/*.ts'
  - 'libs/*/adapters/**/*.ts'
---

# Ports

En TypeScript, un port est une **`abstract class`** : elle sert à la fois de
contrat et de jeton d'injection NestJS (une `interface` disparaît à
l'exécution). Jamais de jeton en chaîne comme `'ICentreRepository'`.

## TENETS-PORT-001 — Les use cases incarnent les ports primaires

`core` · erreur

**Règle.** Un use case implémente ou incarne directement le port primaire. Les
adapters primaires appellent cette capacité applicative. Une interface séparée
est facultative et n'existe que si elle apporte un vrai contrat.

**Pourquoi.** L'application possède son API entrante. Un controller qui
implémente le port primaire inverse la dépendance et masque le use case.

```ts
// ❌ Incorrect
@Controller('centres')
export class CentreController implements CreerCentrePort {
  /* logique ici */
}

// ✅ Correct
export class CreerCentreUseCase {
  async execute(commande: CreerCentreCommande): Promise<Centre> {
    /* … */
  }
}
```

**Correction.** Déplacer le comportement dans le use case ; l'adapter traduit et délègue.

**Vérification en revue.** Chaque controller appelle un use case et
n'implémente pas lui-même la capacité métier.

## TENETS-PORT-002 — L'emplacement d'un port suit la propriété de la capacité

`core` · erreur

**Règle.** Un port va dans le **domaine** s'il exprime une capacité requise par
le domaine (ex. repository d'agrégat). Il va dans l'**application** s'il sert
l'orchestration, le reporting, l'enrichissement ou un autre besoin de workflow.

**Pourquoi.** La propriété d'un port dépend du langage et du besoin de son
consommateur, pas du fournisseur ni de la technologie.

```text
❌ Tous les ports sortants dans domain/ports/ parce qu'ils appellent l'extérieur.

✅ libs/referentiel/domain/src/ports/centre.repository.ts
   libs/referentiel/application/src/ports/stockage-images.port.ts
```

**Correction.** Décrire la capacité du point de vue du consommateur puis placer
le contrat dans la couche qui en possède le sens.

**Vérification en revue.** Le domaine a-t-il besoin de cette capacité, ou
seulement un use case pour coordonner le travail ?

## TENETS-PORT-003 — Un port représente une seule capacité ciblée

`core` · erreur

**Règle.** Un port représente une capacité cohérente, en langage ubiquitaire. Il
n'expose ni client générique, ni boîte à outils, ni workflow en plusieurs étapes.

**Pourquoi.** Des ports ciblés isolent le changement et empêchent les
abstractions techniques de façonner les workflows.

```ts
// ❌ Incorrect
export abstract class ServicesExternes {
  abstract requete(methode: string, url: string, corps: unknown): Promise<unknown>;
}

// ✅ Correct
export abstract class StockageImages {
  abstract enregistrer(image: ImageMagasin): Promise<UrlPublique>;
}
```

**Correction.** Remplacer les opérations génériques par la plus petite capacité métier nécessaire.

**Vérification en revue.** Le nom et les méthodes du port se comprennent-ils
sans connaître le fournisseur ni le transport ?

## TENETS-PORT-005 — Une capacité secondaire ne reçoit jamais de repository

`core` · erreur

**Règle.** Ne jamais passer un repository à un port ou adapter secondaire. Un
adapter secondaire (hors repository) ne construit, n'injecte ni n'appelle de
repository.

**Pourquoi.** Les repositories sont des dépendances d'orchestration. Les donner à
une autre capacité crée des chargements cachés.

```ts
// ❌ Incorrect
await this.exportBenevoles.exporter(centreId, this.benevoleRepository);

// ✅ Correct
const benevoles = await this.benevoleRepository.listByCentre(centreId);
await this.exportBenevoles.exporter(centre, benevoles);
```

**Correction.** Déplacer chaque chargement dans le use case et faire accepter
les objets sémantiques obtenus au contrat du port.

**Vérification en revue.** Aucun repository dans les constructeurs ou méthodes
des adapters secondaires qui ne sont pas des repositories.

## TENETS-PORT-006 — Le use case fournit une entrée complète à la capacité

`core` · erreur

**Règle.** Le use case fournit toutes les informations du domaine dont une
capacité sortante a besoin. Le port ne charge, ne découvre ni ne déduit d'état
manquant depuis la persistance.

**Pourquoi.** Une entrée complète garde l'orchestration visible et rend le port
testable isolément.

```ts
// ❌ Incorrect — l'adapter devra charger la collecte et les poids
await this.exportStatistiques.exporter(collecteId);

// ✅ Correct
await this.exportStatistiques.exporter(syntheseCollecte, FormatExport.PDF);
```

**Correction.** Identifier l'état manquant, le charger dans le use case et
l'ajouter au contrat du port sous une forme sémantique.

**Vérification en revue.** L'implémentation du port peut-elle aboutir sans
interroger la persistance applicative ?

## TENETS-PORT-007 — Les contrats de port refusent les primitives nues

`core` · erreur

**Règle.** Les méthodes publiques des repositories et ports secondaires
n'acceptent pas de `string`, `number`, `boolean`, objet littéral ou fonction
lorsque ces valeurs portent un sens métier.

**Pourquoi.** Les types sémantiques préservent validation, unités, identité et
intention là où une confusion coûte cher.

```ts
// ❌ Incorrect
await centres.get('c3f1…');
await saisies.enregistrerPoids('c3f1…', 12.5, 'kg');

// ✅ Correct
await centres.get(CentreId.creer(commande.centreId));
await saisies.save(saisie); // la saisie porte des PoidsKg
```

**Correction.** Introduire ou réutiliser un value object, un critère nommé ou un
contrat de capacité immuable.

**Vérification en revue.** Contester chaque paramètre primitif qui représente une
identité, un poids, une quantité, un statut, une date ou un critère métier.

## TENETS-PORT-008 — Les ports utilisent le plus petit type sémantique cohérent

`core` · erreur

**Règle.** Choisir le plus petit type cohérent qui exprime complètement la
capacité : agrégat, entité, value object, critère nommé ou contrat applicatif immuable.

**Pourquoi.** Passer un agrégat entier couple inutilement ; l'éclater en
primitives perd le sens.

```ts
// ❌ Incorrect
envoyerPlanning(benevoleId, email, prenom, dateDebut, dateFin, nomMagasin);

// ✅ Correct
envoyerPlanning(new EnvoiPlanning(benevole, slot, magasin));
```

**Correction.** Modéliser l'entrée autour de ce dont l'opération a besoin, en
gardant les objets du domaine quand tout leur sens est requis.

**Vérification en revue.** Le contrat n'est ni un agrégat surdimensionné ni une
liste de paramètres qui reconstruit un concept métier.

## TENETS-PORT-009 — Les contrats de port excluent les représentations externes

`core` · erreur

**Règle.** Un contrat de port n'expose jamais de modèle Prisma, de ligne SQL, de
DTO HTTP, d'objet de SDK ni de type possédé par un adapter.

**Pourquoi.** Les représentations externes rendent l'application dépendante de
détails remplaçables.

```ts
// ❌ Incorrect
import type { Centre as CentreRow } from '@prisma/client';
export abstract class CentreRepository {
  abstract save(row: CentreRow): Promise<void>;
}

// ✅ Correct
export abstract class CentreRepository {
  abstract save(centre: Centre): Promise<void>;
}
```

**Correction.** Déplacer le mapping dans l'adapter et n'exposer que des types
possédés à l'intérieur.

**Vérification en revue.** Imports et signatures des ports : aucun paquet de
framework, persistance, transport ou fournisseur.

## TENETS-PORT-010 — Les identités traversent les ports sous forme de value objects

`core` · erreur

**Règle.** Quand l'identité suffit, passer un identifiant du domaine (ou une
référence locale vers un autre contexte) sous forme de value object, jamais sa
représentation primitive.

**Pourquoi.** Une identité typée empêche les substitutions accidentelles
(`MagasinId` à la place de `CentreId`) et rend la propriété explicite.

```ts
// ❌ Incorrect
abstract listParticipations(magasinId: string): Promise<Participation[]>;

// ✅ Correct
abstract listParticipations(magasinId: MagasinId): Promise<Participation[]>;
```

**Correction.** Remplacer les paramètres d'identité primitifs par des value objects typés.

**Vérification en revue.** Aucune identité primitive dans les signatures de repository ou de port.

> **Note TypeScript.** Le typage structurel rend `CentreId` et `MagasinId`
> interchangeables s'ils ont la même forme. Ajouter un champ privé
> (`private readonly type = 'CentreId'`) rend chaque classe nominale.

## TENETS-PORT-011 — Les ports secondaires exécutent, ils n'orchestrent pas

`core` · erreur

**Règle.** Un port secondaire exécute une seule capacité sortante. Il ne
coordonne ni repositories, ni étapes métier, ni transitions du domaine, ni
autres ports.

**Pourquoi.** L'orchestration appartient aux use cases, où dépendances et
frontières transactionnelles restent visibles.

```ts
// ❌ Incorrect — charge, clôture, exporte et notifie
await this.clotureCollecte.cloturerEtNotifier(collecteId);

// ✅ Correct — une capacité, orchestrée par le use case
const fichier = await this.exportStatistiques.exporter(synthese, FormatExport.XLSX);
```

**Correction.** Déplacer l'orchestration dans le use case et découper le port en
capacités uniques.

**Vérification en revue.** Aucun port ne combine chargement, décision métier et
effet externe.

## TENETS-PATTERN-001 — Capacité sortante chargée par le use case

`pragmatic` · guide (réécrit pour NestJS)

**But.** Garder les capacités sortantes ciblées en chargeant tout l'état du
domaine requis dans le use case.

```ts
export class ExporterPlanningCentreUseCase {
  constructor(
    private readonly centreRepository: CentreRepository,
    private readonly slotRepository: SlotRepository,
    private readonly exportPlanning: ExportPlanning,
  ) {}

  async execute(requete: ExporterPlanningRequete): Promise<FichierExport> {
    const centre = await this.centreRepository.get(requete.centreId);
    if (centre === null) throw new CentreIntrouvable(requete.centreId);
    const slots = await this.slotRepository.listByCollecteEtCentre(requete.collecteId, centre.id);
    return this.exportPlanning.exporter(centre, slots, requete.format);
  }
}
```

L'adapter d'export reçoit des informations complètes ; il ne reçoit pas de
repository et ne charge rien. Si la liste de paramètres devient incohérente,
définir un value object de capacité plutôt que passer un accès à l'infrastructure.

## TENETS-PATTERN-002 — Choisir le type sémantique d'un contrat de port

`pragmatic` · guide

```ts
// Agrégat : la capacité a besoin de son état cohérent
abstract save(collecte: Collecte): Promise<void>;

// Value object : un seul concept
abstract get(collecteId: CollecteId): Promise<Collecte | null>;

// Critère nommé : une requête cohérente
export class CriteresRechercheCollectes {
  constructor(readonly annee?: Annee, readonly statut?: StatutCollecte) {}
}
abstract search(criteres: CriteresRechercheCollectes): Promise<readonly Collecte[]>;

// Contrat applicatif : une projection ou un résultat d'intégration
abstract exporter(synthese: SyntheseCollecte, format: FormatExport): Promise<FichierExport>;
```

Ne pas créer d'enveloppe sans sens métier juste pour éviter une primitive.
