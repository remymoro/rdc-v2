---
paths:
  - 'libs/*/domain/**/*.ts'
---

# Entités, value objects et invariants

## TENETS-ENTITY-001 — L'égalité d'une entité repose sur son identité stable

`core` · erreur

**Règle.** Une entité a une identité stable ; deux entités sont égales si leurs
identités le sont, quels que soient leurs autres attributs.

**Pourquoi.** L'état d'une entité change pendant son cycle de vie, sa continuité
est définie par son identité.

```ts
// ❌ Incorrect — comparaison structurelle
expect(benevoleCharge).toEqual(benevole);

// ✅ Correct
export class Benevole {
  equals(autre: Benevole): boolean {
    return this.id.equals(autre.id);
  }
}
```

**Correction.** Introduire un identifiant du domaine et fonder l'égalité dessus.

**Vérification en revue.** L'égalité d'une entité ne change pas quand son état métier change.

## TENETS-ENTITY-002 — Les entités portent le comportement et protègent leurs invariants

`core` · erreur

**Règle.** Une entité expose un comportement métier qui protège ses invariants.
Les appelants ne modifient pas son état directement et ne reconstruisent pas ses
décisions de façon procédurale.

**Pourquoi.** Garder le comportement avec l'état rend les transitions valides
cohérentes dans tous les workflows.

```ts
// ❌ Incorrect
if (centre.statut !== StatutCentre.ARCHIVE) centre.statut = StatutCentre.INACTIF;

// ✅ Correct
centre.desactiver(maintenant); // lève CentreArchive si le centre est archivé
```

**Correction.** Rendre l'état `private` et déplacer la règle de transition dans une méthode du domaine.

**Vérification en revue.** Aucune affectation directe d'état ni condition de
transition dupliquée chez les appelants.

## TENETS-VALUE-001 — Un value object est immuable et comparé par valeur

`core` · erreur

**Règle.** Un value object est immuable ; l'égalité porte sur sa valeur
sémantique complète.

**Pourquoi.** Un value object décrit ce qu'est une valeur, pas quelle instance elle est.

```ts
// ❌ Incorrect
adresse.ville = 'Agen';

// ✅ Correct
export class Adresse {
  private constructor(
    readonly voie: string,
    readonly codePostal: CodePostal,
    readonly ville: Ville,
  ) {}
  static creer(voie: string, codePostal: CodePostal, ville: Ville): Adresse {
    /* validation */
  }
  equals(autre: Adresse): boolean {
    return this.voie === autre.voie && this.codePostal.equals(autre.codePostal) && this.ville.equals(autre.ville);
  }
}
```

**Correction.** Empêcher la mutation (`readonly`, pas de setter) et remplacer
une valeur modifiée par une nouvelle instance.

**Vérification en revue.** Pas d'égalité par identité, pas de méthode mutante,
pas d'état modifiable de l'extérieur.

## TENETS-VALUE-002 — Un value object représente un concept métier

`core` · erreur

**Règle.** Créer un value object quand une valeur a un sens métier, des
invariants, une unité, un format, des règles de comparaison ou un comportement
au-delà de sa primitive.

**Pourquoi.** Des valeurs nommées évitent les confusions de primitives et
centralisent le comportement du concept.

```ts
// ❌ Incorrect
enregistrerPoids(poids: number, unite: string): void

// ✅ Correct
enregistrerPoids(poids: PoidsKg): void
```

**Correction.** Remplacer les primitives liées par une valeur cohérente qui en porte le sens.

**Vérification en revue.** Contester les primitives répétées représentant une
identité, un poids, une quantité, un créneau, un statut ou un texte validé
(email, téléphone, code postal).

## TENETS-VALUE-003 — Les invariants d'un value object s'appliquent à la création et à la reconstitution

`core` · erreur

**Règle.** Les invariants propres à un value object s'appliquent à **chaque**
instanciation, y compris la reconstitution depuis la base.

**Pourquoi.** Une donnée persistée ne devient pas valide parce qu'elle existe ;
une valeur invalide ne doit pas entrer dans le modèle.

```ts
// ❌ Incorrect — contournement de la validation
const codePostal = Object.assign(Object.create(CodePostal.prototype), { valeur: ligne.codePostal });

// ✅ Correct — même chemin de construction, donc même validation
const codePostal = CodePostal.creer(ligne.codePostal);
```

**Correction.** Mettre la validation dans le seul chemin de construction du value
object ; une donnée corrompue devient un échec explicite de l'adapter.

**Vérification en revue.** Aucun mapper de repository ne contourne les invariants
d'un value object.

> **Convention RDC v2.** Un value object n'a qu'un point d'entrée validant,
> `static creer(...)`, utilisé aussi bien pour les nouvelles valeurs que pour
> la reconstitution. Son constructeur est `private`.

## TENETS-VALIDATE-001 — Les objets du domaine imposent leurs invariants

`core` · erreur

**Règle.** Entités, agrégats et value objects imposent explicitement leurs
invariants sur **tous** les chemins de cycle de vie où ils s'appliquent.

**Pourquoi.** La validité du domaine ne doit pas dépendre de l'entrée utilisée
(HTTP, use case, mapper de repository, tâche cron).

```ts
// ❌ Incorrect — invariant dans le DTO
@Min(0.001) poids!: number;

// ✅ Correct
export class PoidsKg {
  private constructor(readonly valeur: number) {}
  static creer(valeur: number): PoidsKg {
    if (!Number.isFinite(valeur) || valeur <= 0) throw new PoidsInvalide(valeur);
    return new PoidsKg(valeur);
  }
}
```

**Correction.** Déplacer l'invariant dans le type du domaine ; ne garder que la
forme à la frontière externe.

**Vérification en revue.** Création, mutation et reconstitution passent toutes
par l'invariant (voir ADR-0003 R9 pour la reconstitution).
