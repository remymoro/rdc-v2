---
paths:
  - 'libs/*/domain/**/*.ts'
  - 'libs/*/application/**/*.ts'
---

# Événements de domaine

> **Règle projet (ADR-0003 R13).** Pas d'événement de domaine sans consommateur
> réel. Les règles ci-dessous s'appliquent dès qu'un événement est introduit.
> La publication fiable vers l'extérieur (outbox, relais, idempotence :
> EVENT-004 à 009, ASYNC-\*) relève du profil `strict` : elle sera ajoutée par ADR
> avec le premier besoin réel.

## TENETS-EVENT-001 — Un événement de domaine est un enregistrement interne immuable

`pragmatic` · erreur

**Règle.** Un événement de domaine est l'enregistrement immuable d'un fait
accompli, nommé dans le langage du contexte, avec son heure métier d'occurrence.

**Pourquoi.** Un événement décrit un fait passé ; il ne change pas une fois enregistré.

```ts
// ❌ Incorrect
export class CollecteDemarrage {
  statut!: string;
}

// ✅ Correct
export class CollecteDemarree {
  constructor(
    readonly collecteId: CollecteId,
    readonly survenueLe: Date,
  ) {
    Object.freeze(this);
  }
}
```

**Correction.** Type immuable du domaine, nom au passé, valeurs sémantiques, `survenueLe` explicite.

**Vérification en revue.** Immuabilité, nom au passé, valeurs sémantiques, heure d'occurrence.

## TENETS-EVENT-002 — C'est le comportement du domaine qui enregistre l'événement

`pragmatic` · erreur

**Règle.** L'agrégat qui réalise une transition enregistre l'événement **après**
le succès de la transition. Repositories et adapters ne déduisent pas
d'événements à partir des changements persistés.

**Pourquoi.** Seul le domaine sait si le fait métier a vraiment eu lieu.

```ts
// ❌ Incorrect — dans un repository
if (ligne.statut === 'EN_COURS' && avant.statut === 'PREPARATION') publier(new CollecteDemarree(/* … */));

// ✅ Correct
demarrer(maintenant: Date): void {
  this.verifierDemarrable(maintenant);
  this.statut = StatutCollecte.EN_COURS;
  this.evenements.push(new CollecteDemarree(this.id, maintenant));
}
```

**Correction.** Enregistrer l'événement dans le comportement réussi ; supprimer toute déduction côté adapter.

**Vérification en revue.** Chaque événement remonte à la transition qui l'enregistre.

## TENETS-EVENT-003 — Un événement de domaine n'est pas un contrat externe

`pragmatic` · erreur

**Règle.** Ne jamais sérialiser ni publier directement un événement de domaine
vers l'extérieur. Les événements sélectionnés sont traduits en événements
d'intégration explicites.

**Pourquoi.** Les événements de domaine évoluent avec le modèle interne ; un
contrat externe exige un schéma et une compatibilité maîtrisés.

```ts
// ❌ Incorrect
await this.bus.publier(JSON.stringify(collecteDemarree));

// ✅ Correct
const evenement = this.fabriqueCollecteDemarreeV1.creer(collecteDemarree);
await this.outboxIntegration.ajouter(evenement);
```

**Correction.** Introduire un événement d'intégration possédé par l'application et une fabrique de mapping.

**Vérification en revue.** Aucun adapter de messagerie n'accepte un type d'événement de domaine.
