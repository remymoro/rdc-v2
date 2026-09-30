---
paths:
  - 'libs/*/domain/**/*.ts'
  - 'libs/*/application/**/*.ts'
  - 'libs/*/adapters/**/*.ts'
---

# Repositories

Le contrat d'un repository est une `abstract class` dans
`libs/<contexte>/domain/src/ports/`. Son implémentation Prisma est dans
`libs/<contexte>/adapters/`.

## TENETS-REPO-001 — Un repository représente la persistance d'un agrégat

`core` · erreur

**Règle.** Un repository représente les besoins de collection et de persistance
**d'une** racine d'agrégat, en langage métier.

**Pourquoi.** Les repositories sont des contrats du domaine utilisés par les use
cases, pas des services génériques d'accès à la base.

```ts
// ❌ Incorrect
export abstract class BaseDeDonnees {
  abstract executer(sql: string): Promise<unknown[]>;
}

// ✅ Correct
export abstract class CentreRepository {
  abstract get(id: CentreId): Promise<Centre | null>;
  abstract save(centre: Centre): Promise<void>;
}
```

**Correction.** Définir le contrat autour des opérations d'agrégat dont les use
cases ont besoin ; la technologie de requête va dans l'adapter.

**Vérification en revue.** Noms et méthodes décrivent la persistance d'un agrégat, sans vocabulaire de base de données.

## TENETS-REPO-002 — Les écritures acceptent des racines d'agrégat

`core` · erreur

**Règle.** Les méthodes d'écriture acceptent des racines d'agrégat complètes.
Les enfants sont persistés via le repository de leur agrégat.

**Pourquoi.** La racine protège les invariants et définit la frontière de cohérence.

```ts
// ❌ Incorrect
await saisieItemRepository.save(saisie.items[0]);

// ✅ Correct
saisie.ajouterPoids(produitId, poids, maintenant);
await saisieRepository.save(saisie);
```

**Correction.** Supprimer les repositories d'enfants ; le repository de l'agrégat
mappe et persiste l'ensemble.

**Vérification en revue.** Aucune méthode d'écriture publique n'accepte un membre non racine.

## TENETS-REPO-003 — Les requêtes utilisent des critères sémantiques

`core` · erreur

**Règle.** Les requêtes acceptent identifiants du domaine, value objects,
critères nommés ou spécifications. Jamais d'objet littéral brut, de fonction,
de clause Prisma (`where`) ni de primitive nue.

**Pourquoi.** Des critères sémantiques gardent la mécanique de persistance hors
des use cases et rendent l'intention explicite.

```ts
// ❌ Incorrect
await collecteRepository.search({ where: { statut: 'EN_COURS' } });

// ✅ Correct
await collecteRepository.search(new CriteresRechercheCollectes({ statut: StatutCollecte.EN_COURS }));
```

**Correction.** Remplacer les paramètres d'implémentation par un concept de requête nommé et immuable.

**Vérification en revue.** Aucun objet littéral, callback, fragment SQL, clause ORM ni identifiant primitif.

## TENETS-REPO-004 — Les noms de méthode expriment le résultat

`pragmatic` · avertissement

**Règle.** `get` ou `getBy…` pour un résultat, `list…` pour une collection
bornée, `search` pour une collection selon critères, `existsBy…` pour
l'existence. **Jamais `find…`.**

**Pourquoi.** Ces verbes indiquent la cardinalité et le résultat attendus, mieux
que l'ambigu `find`.

```ts
// ❌ Incorrect
findById(id);
findByCentre(centreId);
findDoublon(criteres);

// ✅ Correct
get(id);
listByCentre(centreId);
existsByNomEtAdresse(nom, adresse);
```

**Correction.** Renommer le contrat et toutes ses implémentations.

**Vérification en revue.** Aucune méthode de repository ni de test commençant par `find`.

## TENETS-REPO-005 — Une recherche unitaire renvoie l'absence normalement

`core` · erreur

**Règle.** Une recherche d'un seul résultat renvoie l'agrégat ou `null`. Le use
case décide si l'absence est une erreur pour son workflow.

**Pourquoi.** L'absence est un résultat de persistance ; `CentreIntrouvable` est
une interprétation applicative qui varie selon le use case.

```ts
// ❌ Incorrect — dans l'adapter
if (!ligne) throw new CentreIntrouvable(id);

// ✅ Correct — dans le use case
const centre = await this.centreRepository.get(commande.centreId);
if (centre === null) throw new CentreIntrouvable(commande.centreId);
```

**Correction.** Renvoyer `null` depuis le repository et déplacer le « non trouvé » dans le use case.

**Vérification en revue.** Aucun adapter de repository ne lève d'échec applicatif « introuvable ».

## TENETS-REPO-006 — Un repository renvoie des modèles du domaine

`core` · erreur

**Règle.** Un repository renvoie des racines d'agrégat complètement
reconstituées, des modèles de lecture du domaine explicitement prévus, ou
l'absence. Jamais de modèle Prisma, de ligne, d'enregistrement sérialisé ni
d'objet non typé.

**Pourquoi.** Les représentations de persistance appartiennent aux adapters et ne
portent ni comportement ni invariant.

```ts
// ❌ Incorrect
abstract get(id: CentreId): Promise<Prisma.CentreGetPayload<{}> | null>;

// ✅ Correct
abstract get(id: CentreId): Promise<Centre | null>;
```

**Correction.** Ajouter dans l'adapter le mapping de la ligne vers l'objet du domaine complet.

**Vérification en revue.** Types de retour des repositories et code des use cases : aucune préoccupation de persistance.

## TENETS-REPO-007 — Les adapters de repository mappent sans règle métier

`core` · erreur

**Règle.** Une implémentation de repository contient des opérations de
persistance et un mapping explicite source → cible. Elle ne prend aucune
décision métier, n'appelle pas `creer()` et n'orchestre pas de workflow.

**Pourquoi.** Les adapters reconstruisent l'état existant ; le comportement
métier et les décisions applicatives sont à l'intérieur.

```ts
// ❌ Incorrect
async save(collecte: Collecte) {
  if (collecte.dateFinDepassee()) collecte.marquerEnAttenteCloture(new Date());
  await this.tx.collecte.upsert(/* … */);
}

// ✅ Correct
async save(collecte: Collecte): Promise<void> {
  const donnees = versCollecteRow(collecte);
  await this.transaction.client.collecte.upsert({ where: { id: donnees.id }, create: donnees, update: donnees });
}
```

**Correction.** Déplacer les règles métier à l'intérieur ; remplacer les appels
de création par un mapping directionnel vers `reconstituer()`.

**Vérification en revue.** Aucun `.creer(`, aucune branche métier, aucun helper ambigu `hydrater` dans les repositories.
