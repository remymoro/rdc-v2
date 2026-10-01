# Étape 2 — Cycle de vie d'un centre (désactiver, réactiver, archiver)

- **Contexte :** Référentiel
- **Statut :** spécification prête, implémentation non commencée
- **Décisions :** [ADR-0011](../adr/0011-cycle-de-vie-centre.md)

## 1. Besoin

Un administrateur doit pouvoir retirer temporairement un centre de l'activité
(fermeture, travaux, absence de bénévoles), puis le remettre en service, ou le
retirer définitivement sans perdre son historique (collectes, saisies). Un
centre n'est jamais supprimé : il est **archivé**.

## 2. Règles métier

### Statuts

| Statut    | Sens                                                     |
| --------- | -------------------------------------------------------- |
| `ACTIF`   | Statut initial ; le centre participe aux collectes.      |
| `INACTIF` | Retiré temporairement ; peut être réactivé.              |
| `ARCHIVE` | Retiré définitivement ; plus aucune transition possible. |

`INACTIF` existe déjà en base (enum `StatutCentre` de la migration v1 initiale)
mais pas encore dans le domaine v2 : la reconstitution d'un centre `INACTIF`
repris de la v1 doit fonctionner.

### Transitions

```text
          desactiver()             archiver()
  ACTIF ───────────────► INACTIF ───────────────► ARCHIVE
    ▲  ◄───────────────     │                        ▲
    │      reactiver()      │                        │
    └───────────────────────┴──── archiver() ────────┘
```

| Depuis \ Action | `desactiver()`       | `reactiver()`        | `archiver()` |
| --------------- | -------------------- | -------------------- | ------------ |
| `ACTIF`         | → `INACTIF`          | sans effet           | → `ARCHIVE`  |
| `INACTIF`       | sans effet           | → `ACTIF`            | → `ARCHIVE`  |
| `ARCHIVE`       | ❌ `CENTRE_ARCHIVED` | ❌ `CENTRE_ARCHIVED` | sans effet   |

- **R1** — Une transition effective met `modifieLe` à l'instant reçu (`maintenant`).
- **R2** — Une action qui mène au statut déjà en place est **sans effet** : ni
  erreur, ni changement de `modifieLe` (double clic, nouvel essai réseau).
- **R3** — L'archivage est **définitif** : un centre archivé refuse
  `desactiver()` et `reactiver()` avec `CentreArchive` (`CENTRE_ARCHIVED`).
  Aucun désarchivage dans cette étape.
- **R4** — Aucune condition liée aux autres contextes (collectes en cours,
  magasins, bénévoles, responsables) : ces contextes n'existent pas encore en
  v2. Elles s'ajouteront avec eux (voir § 7).
- **R5** — Aucun autre champ du centre ne change.

## 3. Critères d'acceptation

| #   | Étant donné                                   | Quand                    | Alors                                                           |
| --- | --------------------------------------------- | ------------------------ | --------------------------------------------------------------- |
| A1  | un centre `ACTIF`                             | on le désactive          | 200, statut `INACTIF`, `updatedAt` = maintenant                 |
| A2  | un centre `INACTIF`                           | on le réactive           | 200, statut `ACTIF`, `updatedAt` = maintenant                   |
| A3  | un centre `ACTIF` ou `INACTIF`                | on l'archive             | 200, statut `ARCHIVE`                                           |
| A4  | un centre déjà dans le statut visé            | on rejoue l'action       | 200, centre inchangé (`updatedAt` compris)                      |
| A5  | un centre `ARCHIVE`                           | on le désactive/réactive | 409 `CENTRE_ARCHIVED`, rien n'est enregistré                    |
| A6  | aucun centre de cet identifiant               | n'importe quelle action  | 404 `CENTRE_NOT_FOUND`                                          |
| A7  | un identifiant qui n'est pas un UUID          | n'importe quelle action  | 400 `CENTRE_ID_INVALID`                                         |
| A8  | deux modifications simultanées du même centre | la seconde s'enregistre  | 409 `CENTRE_CONCURRENT_MODIFICATION`, la première est conservée |

## 4. Contrat HTTP

> ⚠️ **À vérifier contre la v1** : les routes exactes de RDC v1 ne sont pas
> disponibles. Le front Angular v1 doit fonctionner sans modification
> (ADR-0009) ; corriger ce tableau avant le cycle HTTP si la v1 diffère.

| Méthode | Route                         | Succès                |
| ------- | ----------------------------- | --------------------- |
| `PATCH` | `/api/centres/:id/desactiver` | 200 + `CentreReponse` |
| `PATCH` | `/api/centres/:id/reactiver`  | 200 + `CentreReponse` |
| `PATCH` | `/api/centres/:id/archiver`   | 200 + `CentreReponse` |

- Pas de corps de requête. Réponse : même `CentreReponse` que la création.
- ⚠️ `versCentreReponse` fixe `responsablesCount: 0`, juste à la création
  seulement : un centre repris de la v1 peut avoir des responsables. Avant le
  cycle 17, soit le compter (lecture dédiée), soit répondre `204` sans corps si
  la v1 le permet ; ne jamais renvoyer un 0 faux.
- Format d'erreur inchangé (`envoyerErreur`, ADR-0009).
- **Routes non protégées** tant que l'étape 4 n'existe pas : le garde-fou
  `verifierDeploiementAutorise` reste en place.

| Erreur                      | Couche (fichier)                               | Code                             | HTTP |
| --------------------------- | ---------------------------------------------- | -------------------------------- | ---- |
| `CentreIdInvalide` (existe) | domaine (`centre/centre-id.ts`)                | `CENTRE_ID_INVALID`              | 400  |
| `CentreArchive`             | domaine (`centre/centre.errors.ts`)            | `CENTRE_ARCHIVED`                | 409  |
| `CentreIntrouvable`         | application (`errors.ts`)                      | `CENTRE_NOT_FOUND`               | 404  |
| `ConflitModificationCentre` | port (`ports/centre.repository.ts`, ERROR-004) | `CENTRE_CONCURRENT_MODIFICATION` | 409  |

Codes `CENTRE_NOT_FOUND` et `CENTRE_CONCURRENT_MODIFICATION` : **à aligner sur
la v1** si elle en avait (TENETS-ERROR-008, règle « code v1 repris exactement »).

## 5. Conception

### Domaine (`libs/referentiel/domain`)

- `StatutCentre` gagne `INACTIF`.
- `Centre` : `statut`, `modifieLe` et `version` deviennent des champs privés
  exposés en lecture (getters) ; les autres champs restent `readonly`.
  Comportements `desactiver(maintenant)`, `reactiver(maintenant)`,
  `archiver(maintenant)` (TENETS-ENTITY-002, TENETS-SERVICE-001 : la transition
  appartient à `Centre`, pas à un service).
- `centre.errors.ts` : `CentreArchive` (`CENTRE_ARCHIVED`, porte le `CentreId`).
- `version: number` dans `EtatCentre` (ADR-0011) ; `creer()` la fixe à 0,
  `reconstituer()` la restitue. Le domaine ne l'incrémente pas : c'est un jeton
  de concurrence géré par le repository.
- Aucun événement de domaine : pas de consommateur (ADR-0003 R13).

### Port `CentreRepository`

```ts
export class ConflitModificationCentre extends Error {
  readonly code = 'CENTRE_CONCURRENT_MODIFICATION';
  constructor(readonly centreId: CentreId) {
    /* … */
  }
}

export abstract class CentreRepository {
  abstract get(id: CentreId): Promise<Centre | null>; // nouveau (REPO-004/005)
  /** Crée le centre, ou le met à jour si sa version n'a pas changé depuis la lecture. */
  abstract save(centre: Centre): Promise<void>; // lève ConflitModificationCentre
  abstract existsByCleDoublon(cle: CleDoublonCentre): Promise<boolean>;
}
```

### Application (`libs/referentiel/application`)

Un use case par workflow (TENETS-APP-001, NAME-003) :
`DesactiverCentreUseCase`, `ReactiverCentreUseCase`, `ArchiverCentreUseCase`.
Commande commune : `{ centreId: CentreId }` (R8, TENETS-PORT-010).

```ts
async execute({ centreId }: CommandeCentre): Promise<Centre> {
  return this.unitOfWork.run(async () => {
    const centre = await this.centreRepository.get(centreId);
    if (centre === null) throw new CentreIntrouvable(centreId); // ERROR-003
    centre.desactiver(this.clock.now());                         // APP-002
    await this.centreRepository.save(centre);
    await this.unitOfWork.commit();                              // UOW-003
    return centre;
  });
}
```

Lecture **dans** la transaction : la lecture et l'écriture voient le même état.

### Adapters (`libs/referentiel/adapters`)

- Migration `AAAAMMJJHHMMSS_ajouter_version_centre` : `version INTEGER NOT NULL
DEFAULT 0` (additive, compatible avec la base v1).
- `centre.mapper.ts` : `versCentre(ligne)` via `Centre.reconstituer()`
  (TENETS-LIFECYCLE-005, ADAPTER-007) ; `INACTIF` dans les deux sens.
- `PrismaCentreRepository.save` :
  1. `updateMany({ where: { id, version }, data: { …, version: version + 1 } })` ;
  2. si 0 ligne : le centre existe-t-il ? oui → `ConflitModificationCentre` ;
     non → `create` (version 0).
- `CentresController` : trois routes ; le paramètre `:id` devient un `CentreId`
  dans le controller (TENETS-ADAPTER-002, APP-005) ; une seule ligne d'appel au
  use case par route (ADAPTER-001).
- `ReferentielErreursHttpFilter` : ajout des trois nouvelles erreurs.
- `ReferentielModule` : câblage des trois use cases (`Scope.REQUEST`).

## 6. Découpage en cycles TDD

Un cycle = un test rouge, le code minimal, le nettoyage, **un commit**
(ADR-0010). Branche : `feat/referentiel-cycle-de-vie-centre`.

| #   | Couche      | Comportement testé                                                                                          | Test                                                   |
| --- | ----------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | domaine     | `reconstituer()` accepte un centre `INACTIF` (+ mapper Prisma `INACTIF`, sinon le `switch` ne compile plus) | `centre.spec.ts`                                       |
| 2   | domaine     | `desactiver()` : `ACTIF` → `INACTIF`, `modifieLe` = maintenant                                              | `centre.spec.ts`                                       |
| 3   | domaine     | `desactiver()` sur `INACTIF` : sans effet (R2)                                                              | `centre.spec.ts`                                       |
| 4   | domaine     | `desactiver()` sur `ARCHIVE` : `CentreArchive` (R3)                                                         | `centre.spec.ts`                                       |
| 5   | domaine     | `reactiver()` : `INACTIF` → `ACTIF` ; sans effet sur `ACTIF` ; refus sur `ARCHIVE`                          | `centre.spec.ts`                                       |
| 6   | domaine     | `archiver()` depuis `ACTIF` et `INACTIF` ; sans effet sur `ARCHIVE`                                         | `centre.spec.ts`                                       |
| 7   | domaine     | `version` : 0 à la création, restituée à la reconstitution                                                  | `centre.spec.ts`                                       |
| 8   | contrat     | `get()` : `null` si absent ; centre complet relu après `save()` (fake en mémoire)                           | `centre.repository.contrat.test-utils.ts`              |
| 9   | contrat     | `save()` d'un centre relu et modifié : le nouvel état est relu                                              | idem                                                   |
| 10  | contrat     | `save()` d'une copie périmée : `ConflitModificationCentre`                                                  | idem                                                   |
| 11  | application | `DesactiverCentreUseCase` : introuvable → `CentreIntrouvable`, rien de validé                               | `desactiver-centre.use-case.spec.ts`                   |
| 12  | application | `DesactiverCentreUseCase` : désactive, enregistre, valide ; `CentreArchive` → pas de commit                 | idem                                                   |
| 13  | application | `ReactiverCentreUseCase` (mêmes cas)                                                                        | `reactiver-centre.use-case.spec.ts`                    |
| 14  | application | `ArchiverCentreUseCase` (mêmes cas)                                                                         | `archiver-centre.use-case.spec.ts`                     |
| 15  | adapters    | Migration `version` ; `PrismaCentreRepository` passe la suite de contrat complète                           | `prisma-centre.repository.integration.spec.ts`         |
| 16  | adapters    | Filtre : `CentreArchive` 409, `CentreIntrouvable` 404, `ConflitModificationCentre` 409                      | `referentiel-erreurs-http.filter.spec.ts`              |
| 17  | HTTP / E2E  | `PATCH …/desactiver` : A1, A5, A6, A7                                                                       | `apps/api-e2e/src/centres/cycle-de-vie-centre.spec.ts` |
| 18  | HTTP / E2E  | `PATCH …/reactiver` et `…/archiver` : A2, A3, A4                                                            | idem                                                   |
| 19  | docs        | Roadmap, README (structure), revue d'architecture                                                           | —                                                      |

Points de vigilance :

- Cycle 1 : ajouter `INACTIF` casse le `switch` exhaustif de
  `versStatutPrisma` ; le corriger dans le même commit pour garder le build vert.
- Cycle 8 : le fake en mémoire doit stocker des **copies** (reconstituées) et
  non la référence de l'agrégat, sinon le test de conflit (10) passe à tort.
- Cycle 15 : `updatedAt` est `@updatedAt` dans Prisma ; vérifier que la valeur
  du domaine (`modifieLe`) est bien celle écrite, et non l'heure du serveur.
- Cycle 15 : `save()` recalcule `cleDoublon`. Pour un centre v1 dont la clé est
  encore `NULL`, désactiver le centre l'écrit ; si un autre centre v1 a la même
  clé, la contrainte d'unicité échoue (500). Le script de reprise de l'ADR-0008
  doit donc passer avant la mise en production de l'étape 2.
- A8 n'est pas testé en E2E (difficile à rendre déterministe) : il est couvert
  par le contrat (cycle 10) sur le fake et sur PostgreSQL.

## 7. Hors périmètre / questions ouvertes

- **Routes et codes d'erreur v1** (§ 4) : à confirmer avant le cycle 17.
- **Conditions inter-contextes** : refuser la désactivation ou l'archivage d'un
  centre engagé dans une collecte en cours ? Que deviennent ses responsables
  (connexion) et ses bénévoles ? À décider avec les contextes Collecte (étape 5)
  et Identité (étape 4) ; le contexte concerné consultera le statut du centre
  via un contrat publié (CONTEXT-\*), sans que `Centre` ne connaisse ces contextes.
- **Lecture** (`GET /api/centres`, filtre par statut) : non demandée ici.
- **Désarchivage** : exclu (R3). Toute demande future passe par un ADR.
- **Authentification ADMIN** : étape 4 (ADR-0009).
