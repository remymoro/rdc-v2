# Design du contexte `collecte` et de la vérification des magasins

- **Statut :** proposé
- **Date :** 2026-10-01
- **Mission :** `docs/missions/verification-magasins/00-plan.md`, lot 1
- **Règles métier :** RDC-COLLECTE-001 à 022
- **Décisions d'architecture :** ADR-0014 et ADR-0015

## But et limites

Ce document fixe les frontières du contexte `collecte` avant son implémentation.
Il couvre le cycle de vie d'une collecte, ses participations, la saisie d'un
centre et la vérification préalable des magasins. Planification, pesées et
statistiques restent hors du contexte : `collecte` leur publie seulement les
réponses définies par RDC-COLLECTE-013.

Les tables de RDC v1 sont conservées sans suppression ni renommage
(ADR-0008). La vérification est additive. Les décisions D-07 et D-13 restent
ouvertes et aucune variante n'est choisie ici. D-12 est décidée depuis : année
civile Europe/Paris de la date de début.

## Modèle et frontières transactionnelles

Le contexte possède trois racines d'agrégat. Elles ne contiennent que des
identifiants vers les autres agrégats et contextes (TENETS-AGGREGATE-005).

### `Collecte`

`Collecte` possède :

- son identité, son nom unique, sa `Periode`, son statut PREPARATION / EN_COURS /
  TERMINEE et ses dates de création et modification ;
- l'ouverture de la planification et le drapeau `enAttenteClotureAdmin` ;
- ses `ParticipationMagasin` (`magasinId`, `centreGestionnaireId`) ;
- l'état de la vérification : NON_OUVERTE avant la première ouverture, OUVERTE,
  puis FERMEE après fermeture explicite ou démarrage ;
- une version technique de concurrence optimiste.

La racine impose les transitions et les invariants portant sur ses membres :
cycle de vie, période, planification, périmètre des participations et état de
la vérification (TENETS-AGGREGATE-001 à 003). Une `ParticipationMagasin` n'a
pas de repository ni de statut propre (D-02, TENETS-AGGREGATE-004).

### `ListeVerification`

Il existe au plus une liste par couple (`collecteId`, `centreId`). Elle possède
ses `ReponseMagasin`, son état EN_COURS / TRANSMISE / RENVOYEE, son avis, ses
transmissions et renvois horodatés, une date de gel éventuelle et sa version.
Une réponse contient `magasinId`, A_CONTACTER / PARTICIPE / NE_PARTICIPE_PAS,
l'indication immuable de participation à la collecte précédente, un commentaire
facultatif, et les auteur et date de sa dernière modification.

Cette racine est séparée de `Collecte` : les responsables des centres doivent
pouvoir écrire simultanément sans charger ni verrouiller toutes les listes
(RDC-COLLECTE-014, TENETS-AGGREGATE-002/003). `figer()` empêche définitivement
`ajouterMagasin`, `repondre`, `transmettre` et `renvoyer`, sans ajouter un
quatrième état au workflow EN_COURS / TRANSMISE / RENVOYEE.

Les transmissions et renvois sont un historique interne immuable. Il conserve
tous les auteurs, dates, avis et raisons, y compris après plusieurs cycles
TRANSMISE → RENVOYEE → TRANSMISE. Le dernier avis reste aussi sur la liste pour
les lectures courantes.

### `SaisieCentre`

`SaisieCentre` est une racine séparée, unique par (`collecteId`, `centreId`).
Son état EN_COURS / TERMINEE_PAR_CENTRE / REOUVERTE_PAR_ADMIN, ses auteurs,
dates et raison de réouverture évoluent indépendamment de `Collecte`. La mettre
dans `Collecte` créerait des conflits entre centres et avec la tâche de clôture,
sans invariant exigeant une modification atomique de toutes les saisies.

Les use cases de clôture chargent les `SaisieCentre` et coordonnent leur lecture
avec `Collecte` dans une unité de travail ; aucun agrégat ne charge un autre
(TENETS-AGGREGATE-006, TENETS-UOW-011).

## Attribution des règles RDC-COLLECTE

| Règle            | Propriétaire de l'invariant ou coordination                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RDC-COLLECTE-001 | `Collecte` impose PREPARATION → EN_COURS → TERMINEE et le drapeau d'attente.                                                                                   |
| RDC-COLLECTE-002 | `Collecte.demarrer` vérifie date et participation ; le use case fige les listes et ferme la vérification dans la même UoW.                                     |
| RDC-COLLECTE-003 | `Collecte.modifier` protège nom et période selon statut et planification.                                                                                      |
| RDC-COLLECTE-004 | `Collecte` protège les participations ; les use cases valident magasin et centre via le port consommateur, et coordonnent le retrait forcé avec planification. |
| RDC-COLLECTE-005 | `Collecte` porte l'attente et la fin ; les use cases vérifient toutes les racines `SaisieCentre` dans la même UoW.                                             |
| RDC-COLLECTE-006 | Le value object `Periode` de `Collecte` garantit les bornes ; la fin de journée est partagée en un seul concept.                                               |
| RDC-COLLECTE-007 | `Collecte`/`FenetreSaisieCollecte`, hors implémentation tant que D-07 est ouverte.                                                                             |
| RDC-COLLECTE-008 | `Collecte` ouvre et ferme la planification.                                                                                                                    |
| RDC-COLLECTE-009 | `SaisieCentre.declarerTerminee` ; le use case vérifie `Collecte` EN_COURS et le centre participant.                                                            |
| RDC-COLLECTE-010 | `SaisieCentre.rouvrir` ; le use case admin vérifie collecte et participation. La forme de la raison reste bloquée par D-13.                                    |
| RDC-COLLECTE-011 | Même racine que RDC-COLLECTE-009 ; use case réservé à l'ADMIN.                                                                                                 |
| RDC-COLLECTE-012 | Use cases de création/modification, repository et contraintes uniques en base.                                                                                 |
| RDC-COLLECTE-013 | Façade publiée `CollectePublique`, implémentée dans `collecte/adapters`.                                                                                       |
| RDC-COLLECTE-014 | `Collecte.ouvrirVerification`, `ListeVerification.creer` et use case atomique sur toutes les listes.                                                           |
| RDC-COLLECTE-015 | `ListeVerification.repondre` ; use case vérifie état OUVERTE et périmètre du jeton.                                                                            |
| RDC-COLLECTE-016 | Requêtes de lecture applicatives, sans mutation d'agrégat.                                                                                                     |
| RDC-COLLECTE-017 | `ListeVerification` sélectionne les PARTICIPE ; le use case appelle `Collecte.inscrireMagasin` et persiste les deux racines dans une UoW.                      |
| RDC-COLLECTE-018 | `Collecte.fermerVerification` ou `demarrer`, puis `ListeVerification.figer` sur toutes les listes dans la même UoW.                                            |
| RDC-COLLECTE-019 | Use case charge la dernière `Collecte` TERMINEE, valide les magasins actuels via le port et inscrit dans la collecte en PREPARATION.                           |
| RDC-COLLECTE-020 | `ListeVerification.transmettre`, avec historique de l'auteur, de la date et de l'avis.                                                                         |
| RDC-COLLECTE-021 | `ListeVerification.renvoyer`, avec historique de l'auteur, de la date et de la raison.                                                                         |
| RDC-COLLECTE-022 | Use cases et repository garantissent l'unicité annuelle ; année civile Europe/Paris de la date de début (D-12 décidée).                                        |

Les règles 007 et 010, pour le caractère obligatoire de la raison, sont
conçues mais non implémentables avant D-07 et D-13. D-03
conditionne en plus le futur comportement de `referentiel` quand un magasin
participe à une collecte active ; ce design ne choisit ni blocage ni retrait.

## Workflows qui traversent des agrégats

Tous les workflows d'écriture ci-dessous utilisent une `UnitOfWork` à usage
unique et appellent `commit()` en dernier (TENETS-UOW-001 à 006).

### Ouvrir la vérification

1. Charger `Collecte`, puis vérifier PREPARATION et vérification NON_OUVERTE.
2. Lire par le port `CandidatsVerification` tous les magasins actifs rattachés
   aux centres actifs.
3. Charger la dernière collecte TERMINEE par date de début et ses participations.
4. Appeler `collecte.ouvrirVerification(maintenant)`.
5. Créer une `ListeVerification` par centre, avec A_CONTACTER et
   `aParticipeCollectePrecedente` calculé pour chaque magasin.
6. Persister la collecte et toutes les listes, puis valider la transaction.

La contrainte unique (`collecteId`, `centreId`) constitue le dernier rempart
contre deux ouvertures concurrentes. Une ouverture partielle est toujours
annulée (RDC-COLLECTE-014, TENETS-UOW-003/004).

### Ajouter un magasin à une liste ouverte

L'admin choisit explicitement le magasin. Le use case recharge son état par le
port consommateur, exige magasin ACTIF et centre ACTIF, détermine la liste de
son centre de rattachement, calcule l'indicateur de collecte précédente puis
appelle `liste.ajouterMagasin`. Aucun `centreId` fourni par le client ne peut
contredire ce rattachement. Un doublon dans la même liste est sans effet. Il
n'y a pas d'abonnement à un événement : RDC-COLLECTE-014 dit que l'admin « peut
ajouter » et ADR-0003 R13 interdit un événement sans consommateur nécessaire.

Un magasin n'a qu'une réponse par collecte, toutes listes confondues. Si le
magasin figure déjà dans la liste d'un autre centre, typiquement après un
transfert de rattachement (`transfererVers`) survenu depuis l'ouverture, l'ajout
est refusé avec `MAGASIN_DEJA_DANS_UNE_LISTE` : RDC-COLLECTE-014 ne prévoit
l'ajout que d'un magasin créé ou réactivé depuis l'ouverture. Le magasin reste
dans sa liste d'origine, dont le centre recueille la réponse ; s'il est inscrit
en lot, l'admin peut ensuite réassigner son centre gestionnaire
(RDC-COLLECTE-004). Le use case vérifie l'absence du magasin dans les autres
listes de la collecte, et la contrainte unique (`collecteId`, `magasinId`) de
`ReponseVerificationMagasin` reste le dernier rempart contre deux ajouts
concurrents ; sa violation est traduite par l'adapter dans la même erreur
(TENETS-ADAPTER-006). Le déplacement automatique de la réponse vers la nouvelle
liste n'est pas retenu (V-5, décidée le 2026-10-01).

### Inscription en lot

1. Charger dans la même UoW la liste et la collecte.
2. Exiger liste TRANSMISE, non figée, vérification OUVERTE et collecte en
   PREPARATION.
3. Revalider via `MagasinsInscriptibles` les statuts actuels de chaque magasin
   PARTICIPE et de son centre ; ne jamais se fier au snapshot d'ouverture.
4. Appeler `collecte.inscrireMagasin` pour chaque candidat encore valide, avec
   le centre de la liste ; les magasins déjà inscrits restent des no-op.
5. Sauvegarder aussi la liste avec contrôle de version, même sans changement
   métier, afin de garantir que l'inscription porte sur la version transmise
   lue par l'admin ; sauvegarder la collecte et valider.

Un magasin devenu non inscriptible fait échouer tout le lot avec son erreur
métier ; l'admin corrige ou renvoie la liste. Il n'y a pas de succès partiel.

### Fermer ou démarrer

Le use case charge la collecte et toutes ses listes, applique la transition de
`Collecte`, appelle `figer(maintenant)` sur chaque liste, persiste toutes les
racines avec leurs versions puis valide. Le démarrage présente au préalable un
avertissement de lecture si des listes ne sont pas transmises ou ont encore des
A_CONTACTER, mais cet avertissement ne devient jamais une précondition.

### Clôturer une collecte

`marquerEnAttenteCloture`, `approuverCloture` et `terminer` lisent les centres
gestionnaires distincts des participations et les `SaisieCentre` correspondants
dans un instantané cohérent. Une ligne absente vaut EN_COURS. Seule la collecte
est modifiée après validation de l'ensemble (RDC-COLLECTE-005).

## Contrat consommé depuis `referentiel`

ADR-0014 introduit `libs/referentiel/contrat`, taguée `context:referentiel`,
`layer:published` et `scope:published`. Elle ne réexporte aucun objet du domaine.
Sa façade, fournie par `referentiel/adapters`, expose des primitives :

```ts
type StatutReferentielPublic = 'ACTIF' | 'INACTIF' | 'ARCHIVE';

type MagasinPublic = {
  id: string;
  statut: StatutReferentielPublic;
  centreId: string;
};

type CentreAvecMagasinsPublic = {
  id: string;
  statut: StatutReferentielPublic;
  magasins: readonly MagasinPublic[];
};

type CentrePublic = {
  id: string;
  statut: StatutReferentielPublic;
};

abstract class ReferentielPublic {
  abstract obtenirMagasin(id: string): Promise<(MagasinPublic & { centreStatut: StatutReferentielPublic }) | null>;
  abstract obtenirCentre(id: string): Promise<CentrePublic | null>;
  abstract listerCentresAvecMagasins(): Promise<readonly CentreAvecMagasinsPublic[]>;
}
```

La méthode de liste ne filtre volontairement pas et conserve les centres sans
magasin : le contrat expose les deux statuts nécessaires à RDC-COLLECTE-004,
014 et 019, et `collecte` exprime dans son propre langage les filtres propres à
chaque workflow.

Dans `collecte/application`, trois ports consommateurs décrivent ces besoins :

```ts
abstract class MagasinsInscriptibles {
  abstract obtenir(magasinId: MagasinId): Promise<EtatMagasinPourCollecte | null>;
}

abstract class CentresGestionnaires {
  abstract obtenir(centreId: CentreId): Promise<EtatCentrePourCollecte | null>;
}

abstract class CandidatsVerification {
  abstract listerActifsParCentreActif(): Promise<readonly CandidatsDUnCentre[]>;
}
```

`CentresGestionnaires` sert à `ReassignerMagasinUseCase` : le centre cible est
quelconque, et RDC-COLLECTE-004 accepte un centre INACTIF mais refuse un centre
ARCHIVE (`CENTRE_ARCHIVE`) ; un centre inconnu donne `CENTRE_NOT_FOUND`. Son
adapter s'appuie sur `obtenirCentre`, et non sur la liste filtrée des centres
actifs de `CandidatsVerification`.

Ces ports sont applicatifs : ils servent à valider des références externes et
à orchestrer, pas à exécuter un comportement pur de l'agrégat
(TENETS-CONTEXT-005/006). Un adapter dans `collecte/adapters` est le seul code
qui importe `@rdc/referentiel-contrat`; il traduit les chaînes et statuts vers
`MagasinId`, `CentreId` et les types locaux (TENETS-CONTEXT-002 à 004).

## Contrat publié par `collecte`

`libs/collecte/contrat`, elle aussi taguée `layer:published` et
`scope:published`, contient `CollectePublique`, implémentée par
`collecte/adapters`. Dates et identifiants sont des chaînes ISO/UUID ; aucun
agrégat ni value object n'en sort.

```ts
type CadrePlanificationPublic = {
  ouverte: boolean;
  dateDebutIso: string;
  dateFinIso: string;
};

abstract class CollectePublique {
  abstract magasinEstInscrit(collecteId: string, magasinId: string): Promise<boolean>;
  abstract obtenirCentreGestionnaire(collecteId: string, magasinId: string): Promise<string | null>;
  abstract obtenirCadrePlanification(collecteId: string): Promise<CadrePlanificationPublic | null>;
  abstract centrePeutPeser(collecteId: string, centreId: string, maintenantIso: string): Promise<boolean>;
  abstract centreGereUneCollecteActive(centreId: string): Promise<boolean>;
}
```

| Question RDC-COLLECTE-013                   | Consommateur           | Implémentation propriétaire                          |
| ------------------------------------------- | ---------------------- | ---------------------------------------------------- |
| Magasin inscrit ?                           | planification, saisie  | requête `collecte/adapters` sur les participations   |
| Centre gestionnaire ?                       | saisie, identité-accès | requête `collecte/adapters` sur la participation     |
| Planification ouverte et période ?          | planification          | lecture de `Collecte`                                |
| Centre autorisé à peser maintenant ?        | saisie                 | application des règles de collecte et `SaisieCentre` |
| Centre gestionnaire d'une collecte active ? | référentiel            | requête sur PREPARATION / EN_COURS et participations |

Les ports consommateurs et leurs adapters sont explicites :

| Contexte propriétaire du port | Port consommateur                 | Adapter qui importe `@rdc/collecte-contrat`                    |
| ----------------------------- | --------------------------------- | -------------------------------------------------------------- |
| planification/application     | `CadreCollectePourPlanification`  | `CollecteCadrePourPlanification` dans `planification/adapters` |
| saisie/application            | `AutorisationSaisieDansCollecte`  | `CollecteAutorisationSaisie` dans `saisie/adapters`            |
| identite-acces/application    | `CentreGestionnaireDansCollecte`  | `CollecteCentreGestionnaire` dans `identite-acces/adapters`    |
| referentiel/application       | `CollectesActivesPourReferentiel` | `CollecteCollectesActives` dans `referentiel/adapters`         |

La façade publiée est possédée par `collecte/contrat` et implémentée par
`collecte/adapters`; elle n'est jamais importée par le domaine ou l'application
du consommateur. Si D-03 retient le blocage, une question symétrique
`magasinParticipeAUneCollecteActive` sera ajoutée ; si D-03 retient le retrait
automatique, un workflow de coordination fera l'objet d'un design distinct.

## Persistance additive

Le schéma cible ci-dessous montre uniquement les ajouts et les relations utiles.
Les modèles et colonnes v1 restent en place, y compris `dateFinSaisie` et
`saisieOuverte`, tant que leur reprise n'est pas décidée (ADR-0008, D-07).

```prisma
model Collecte {
  // colonnes v1 inchangées
  etatVerification EtatVerification @default(NON_OUVERTE)
  version           Int              @default(0)
  listesVerification ListeVerification[]
}

model ListeVerification {
  id            String                  @id @default(uuid())
  collecteId    String
  centreId      String
  statut        StatutListeVerification @default(EN_COURS)
  avisCentre    String?
  figeeLe       DateTime?
  version       Int                     @default(0)
  createdAt     DateTime                @default(now())
  updatedAt     DateTime                @updatedAt

  collecte      Collecte                @relation(fields: [collecteId], references: [id], onDelete: Cascade)
  centre        Centre                  @relation(fields: [centreId], references: [id], onDelete: Restrict)
  reponses      ReponseVerificationMagasin[]
  transmissions TransmissionListeVerification[]
  renvois       RenvoiListeVerification[]

  @@unique([collecteId, centreId])
  @@unique([id, collecteId])
  @@index([collecteId, statut])
  @@index([centreId])
}

model ReponseVerificationMagasin {
  listeId                         String
  collecteId                      String
  magasinId                       String
  reponse                         ReponseMagasin @default(A_CONTACTER)
  aParticipeCollectePrecedente    Boolean
  commentaire                     String?
  repondueLe                      DateTime?
  repondueParUtilisateurId        String?
  createdAt                       DateTime        @default(now())
  updatedAt                       DateTime        @updatedAt

  liste   ListeVerification @relation(fields: [listeId, collecteId], references: [id, collecteId], onDelete: Cascade)
  magasin Magasin           @relation(fields: [magasinId], references: [id], onDelete: Restrict)

  @@id([listeId, magasinId])
  @@unique([collecteId, magasinId])
  @@index([magasinId])
  @@index([listeId, reponse])
}

model TransmissionListeVerification {
  id                     String   @id @default(uuid())
  listeId                String
  avisCentre             String?
  auteurUtilisateurId    String
  transmiseLe            DateTime
  liste ListeVerification @relation(fields: [listeId], references: [id], onDelete: Cascade)
  @@index([listeId, transmiseLe])
}

model RenvoiListeVerification {
  id                     String   @id @default(uuid())
  listeId                String
  raison                 String
  auteurUtilisateurId    String
  renvoyeeLe             DateTime
  liste ListeVerification @relation(fields: [listeId], references: [id], onDelete: Cascade)
  @@index([listeId, renvoyeeLe])
}

enum EtatVerification {
  NON_OUVERTE
  OUVERTE
  FERMEE
}

enum StatutListeVerification {
  EN_COURS
  TRANSMISE
  RENVOYEE
}

enum ReponseMagasin {
  A_CONTACTER
  PARTICIPE
  NE_PARTICIPE_PAS
}
```

Deux migrations additives et séquentielles réalisent ce schéma. Le lot 2 ajoute
`Collecte.version`, `Collecte.etatVerification` et l'enum `EtatVerification` en
même temps que le repository Prisma et `POST /api/collectes`. Le lot 6 ajoute
les quatre tables de vérification (dont `collecteId` recopié dans chaque
réponse, garanti cohérent avec sa liste par la clé étrangère composite, pour
l'unicité d'une réponse par magasin et par collecte), les enums
`StatutListeVerification` et `ReponseMagasin`, les clés étrangères, index et contraintes d'unicité. Aucune
migration ne supprime, ne renomme ni ne réinterprète une donnée v1. Les
back-relations ajoutées à `Centre` et `Magasin` ne créent pas de colonne
supplémentaire dans leurs tables.

## Concurrence

ADR-0015 retient une version optimiste sur `Collecte` et
`ListeVerification`. Chaque `save` exécute un `UPDATE ... WHERE id = ? AND
version = ?` puis incrémente la version ; zéro ligne modifiée produit un 409.
Les créations restent protégées par leurs contraintes uniques. La suite de
contrat de chaque repository vérifie le conflit (TENETS-AGGREGATE-007).

Ainsi les quatorze centres modifient quatorze agrégats différents. Deux
responsables du même centre reçoivent un conflit au lieu de perdre une réponse.
La fermeture et le démarrage figent toutes les listes dans la même UoW : une
réponse qui gagne la course est incluse avant le gel ; une réponse fondée sur
une ancienne version échoue. L'inscription en lot contrôle la version de la
liste transmise et celle de la collecte, donc un renvoi ou une autre inscription
concurrente ne produit ni décision sur une réponse obsolète ni doublon.

ADR-0013 n'est pas étendu : son dernier-qui-écrit-gagne est une exception
motivée par un seul administrateur sur `Centre`. Ici, plusieurs responsables,
la tâche de démarrage et l'admin écrivent réellement en parallèle.

## Erreurs et statuts HTTP visés

Les erreurs du domaine portent les codes stables ; l'application ajoute les
absences et conflits de workflow ; l'adapter choisit le statut HTTP (ADR-0003
R6). Les codes v1 sont conservés lorsqu'ils existent.

| Code                                                                                                                  | HTTP | Cas                                                |
| --------------------------------------------------------------------------------------------------------------------- | ---: | -------------------------------------------------- |
| `COLLECTE_ID_EMPTY`, `COLLECTE_ID_INVALID`                                                                            |  400 | identifiant de collecte invalide                   |
| `PERIODE_DATE_DEBUT_INVALIDE`, `PERIODE_DATE_DEBUT_PASSEE`, `PERIODE_DATE_FIN_INVALIDE`                               |  400 | période invalide                                   |
| `COLLECTE_NOT_FOUND`                                                                                                  |  404 | collecte absente                                   |
| `COLLECTE_ALREADY_EXISTS`                                                                                             |  409 | nom déjà pris (nouveau code v2)                    |
| `COLLECTE_ANNEE_DEJA_EXISTANTE`                                                                                       |  409 | année déjà prise (statut v1 conservé)              |
| `COLLECTE_STATUT_INVALIDE`, `COLLECTE_MODIFICATION_INTERDITE`, `COLLECTE_REASSIGNATION_INTERDITE`                     |  400 | transition interdite (statut v1 conservé)          |
| `COLLECTE_MODIFICATION_INTERDITE_PLANIFICATION_OUVERTE`                                                               |  400 | modification pendant la planification              |
| `COLLECTE_DEMARRAGE_AVANT_DATE_DEBUT`, `COLLECTE_AUCUN_MAGASIN_INSCRIT`                                               |  400 | collecte non démarrable (statut v1 conservé)       |
| `COLLECTE_PLANIFICATION_DEJA_OUVERTE`, `COLLECTE_PLANIFICATION_DEJA_FERMEE`, `COLLECTE_PLANIFICATION_STATUT_INVALIDE` |  400 | transition de planification invalide               |
| `COLLECTE_CLOTURE_NON_DEMANDEE`, `COLLECTE_SAISIES_CENTRES_INCOMPLETES`                                               |  400 | clôture impossible                                 |
| `COLLECTE_STATUT_INVALIDE_POUR_CONFIRMATION`, `COLLECTE_STATUT_INVALIDE_POUR_REOUVERTURE`                             |  403 | opération de saisie non autorisée dans cet état    |
| `MAGASIN_NOT_FOUND`                                                                                                   |  404 | magasin absent du référentiel                      |
| `CENTRE_NOT_FOUND`                                                                                                    |  404 | centre cible absent du référentiel                 |
| `MAGASIN_NON_INSCRIT`                                                                                                 |  400 | magasin absent de la collecte (statut v1 conservé) |
| `MAGASIN_INACTIF`, `CENTRE_ARCHIVE`                                                                                   |  400 | référence non inscriptible selon RDC-COLLECTE-004  |
| `MAGASIN_A_DES_SLOTS_ACTIFS`                                                                                          |  409 | retrait sans `force` impossible                    |
| `CENTRE_NON_PARTICIPANT`                                                                                              |  403 | centre hors périmètre de la collecte               |
| `SAISIE_CENTRE_DEJA_TERMINEE`, `SAISIE_CENTRE_DEJA_ROUVERTE`                                                          |  409 | transition de saisie déjà faite                    |
| `SAISIE_CENTRE_RAISON_REOUVERTURE_INVALIDE`                                                                           |  400 | raison invalide, sous réserve de D-13              |
| `VERIFICATION_DEJA_OUVERTE`, `VERIFICATION_FERMEE`                                                                    |  409 | ouverture répétée ou modification après fermeture  |
| `LISTE_VERIFICATION_NOT_FOUND`, `MAGASIN_HORS_LISTE`                                                                  |  404 | liste ou réponse absente                           |
| `REPONSE_MAGASIN_INVALIDE`, `RAISON_RENVOI_INVALIDE`                                                                  |  400 | valeur ou raison invalide                          |
| `LISTE_DEJA_TRANSMISE`, `LISTE_NON_TRANSMISE`                                                                         |  409 | transition de liste invalide                       |
| `MAGASIN_DEJA_DANS_UNE_LISTE`                                                                                         |  409 | magasin déjà dans la liste d'un autre centre       |
| `COLLECTE_CONCURRENT_UPDATE`, `LISTE_VERIFICATION_CONCURRENT_UPDATE`                                                  |  409 | version optimiste périmée                          |
| `FORBIDDEN`                                                                                                           |  403 | rôle ou centre du jeton non autorisé               |

Les erreurs inattendues restent 500 `INTERNAL_ERROR`. Les limites de longueur
des commentaires, avis et raisons seront définies avec les value objects du
lot 4 ; elles ne changent pas les codes ci-dessus.

## API HTTP de la vérification

Ce sont de nouvelles routes, sans contrainte de compatibilité v1. Le centre
d'un responsable vient toujours du jeton (RDC-ACCES-002) et les rôles sont
déclarés par métadonnée au guard unique (RDC-ACCES-003).

| Méthode et route                                                    | Rôle               | Résultat                                        |
| ------------------------------------------------------------------- | ------------------ | ----------------------------------------------- |
| `POST /api/collectes/:id/verification/ouvrir`                       | ADMIN              | 201, résumé et listes créées                    |
| `GET /api/collectes/:id/verification`                               | ADMIN              | avancement agrégé de tous les centres           |
| `GET /api/collectes/:id/verification/listes/:centreId`              | ADMIN              | détail d'une liste                              |
| `GET /api/collectes/:id/verification/ma-liste`                      | RESPONSABLE_CENTRE | liste du centre du jeton                        |
| `PUT /api/collectes/:id/verification/ma-liste/reponses/:magasinId`  | RESPONSABLE_CENTRE | 200, réponse mise à jour                        |
| `POST /api/collectes/:id/verification/ma-liste/transmettre`         | RESPONSABLE_CENTRE | 200, liste transmise avec `avisCentre?`         |
| `POST /api/collectes/:id/verification/listes/:centreId/transmettre` | ADMIN              | 200, transmission exceptionnelle par le siège   |
| `POST /api/collectes/:id/verification/listes/:centreId/renvoyer`    | ADMIN              | 200, liste renvoyée avec `raison`               |
| `POST /api/collectes/:id/verification/listes/:centreId/inscrire`    | ADMIN              | 200, liste des magasins nouvellement inscrits   |
| `POST /api/collectes/:id/verification/magasins/:magasinId`          | ADMIN              | 200, ajout à la liste du centre de rattachement |
| `POST /api/collectes/:id/verification/fermer`                       | ADMIN              | 204, vérification et listes figées              |

L'ADMIN conserve les routes unitaires d'inscription hors liste. Il peut lire ou
transmettre exceptionnellement une liste mais ne saisit pas une réponse à la
place du centre.

## Découpage des lots corrigé

| Lot | Contenu après design                                                                                                                                                                       | Prérequis                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| 2   | Tranche complète « créer une collecte » : domain/application, `Collecte`, période, repositories mémoire et Prisma, migration `version` + `etatVerification`, `POST /api/collectes` et E2E. | lot 1 fusionné                                        |
| 3   | Participations, reprise précédente, contrat publié `referentiel`, ports et adapter de traduction ; extension du repository Prisma existant.                                                | lot 2, étape 3, ADR-0014 accepté                      |
| 4   | Domaine `ListeVerification`, historique, gel, version et suites de contrat en mémoire.                                                                                                     | lot 2                                                 |
| 2b  | Démarrer une collecte et figer atomiquement les listes ; tâche planifiée.                                                                                                                  | lots 2 et 4                                           |
| 5   | Use cases ouvrir/répondre/transmettre/renvoyer/fermer/inscrire en lot, lectures, UoW et tests de concurrence applicatifs.                                                                  | lots 2b, 3 et 4                                       |
| 6   | Tables de la vérification, migration additive, repository Prisma de `ListeVerification`, contrats d'adapter et tests d'intégration de concurrence.                                         | lot 5, ADR-0015 accepté                               |
| 7   | Routes de la vérification, guards, filtres d'erreurs et E2E.                                                                                                                               | lot 6, étape 4 terminée, décision client COLLECTE-014 |

Le lot 2b n'est donc plus parallèle au lot 4. Les lots 3 et 4 restent
parallélisables après le lot 2. Les migrations ne sont pas concurrentes : le
lot 2 livre la première tranche verticale complète et sa migration, puis le lot
6 ajoute seulement la persistance propre à la vérification.

## Hypothèses ouvertes et portes de décision

| Décision | Question                                    | Effet sur l'implémentation                                                                         |
| -------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| D-03     | blocage ou retrait d'un magasin actif       | extension du contrat publié de `collecte`, sans choix dans ce lot                                  |
| D-07     | fenêtre de saisie                           | bloque RDC-COLLECTE-007 et le calcul de `centrePeutPeser`                                          |
| D-12     | fuseau de l'année                           | ✅ décidée : année civile Europe/Paris, appliquée dès le lot 2                                     |
| D-13     | raison réellement saisie                    | bloque la forme finale de RDC-COLLECTE-010                                                         |
| V-1      | avis global facultatif                      | hypothèse actuelle conservée par RDC-COLLECTE-020                                                  |
| V-2      | A_CONTACTER autorisé à la transmission      | hypothèse actuelle conservée par RDC-COLLECTE-020                                                  |
| V-3      | visibilité admin avant transmission         | hypothèse actuelle conservée par RDC-COLLECTE-016                                                  |
| V-4      | liste incomplète non bloquante              | hypothèse actuelle conservée par RDC-COLLECTE-018                                                  |
| V-5      | magasin transféré pendant la vérification   | ✅ décidée : reste dans sa liste d'origine, ajout ailleurs refusé (RDC-COLLECTE-014)               |
| Client   | le responsable saisit les réponses dans RDC | à présenter avant le lot 7, sans remettre en cause le domaine tant que COLLECTE-014 reste la règle |

Toute réponse différente sur V-1 à V-5 modifie d'abord la règle métier puis ce
design. Aucune règle marquée ⚠️ n'est tranchée par ce document.
