---
paths:
  - 'libs/*/domain/**/*.ts'
  - 'libs/*/application/**/*.ts'
  - 'libs/*/adapters/**/*.ts'
---

# Création et reconstitution

**Convention RDC v2 (adaptation TypeScript de Tenets).** Chaque entité ou
agrégat a un constructeur `private` et deux points d'entrée nommés :

| Point d'entrée                     | Rôle                                                                                                                         | Qui l'appelle         |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `static creer(params, maintenant)` | Nouvel objet : identité, valeurs par défaut, statut initial, événement de création                                           | Use cases             |
| `static reconstituer(etat)`        | Objet existant : état persisté complet, invariants de structure revalidés, **aucune** valeur par défaut, **aucun** événement | Mappers de repository |

Tenets impose en Python des fonctions de module `create_<objet>()` ; son propre
guide admet des fabriques nommées dans les autres langages. C'est le choix
retenu ici (ADR-0003).

## TENETS-LIFECYCLE-001 — Création et reconstitution sont distinctes

`pragmatic` · erreur

**Règle.** La création établit un nouvel objet du point de vue métier. La
reconstitution rebâtit un objet existant depuis l'état persisté. Elles ont des
points d'entrée sémantiquement distincts.

**Pourquoi.** La création peut générer identité, valeurs par défaut et événements
qui ne doivent jamais se produire pendant une reconstitution.

```ts
// ❌ Incorrect — dans un repository
return Collecte.creer({ nom: ligne.nom, dateDebut: ligne.dateDebut, dateFin: ligne.dateFin }, ligne.createdAt);

// ✅ Correct
const nouvelle = Collecte.creer({ id, nom, periode }, maintenant); // use case
const existante = Collecte.reconstituer(versEtatCollecte(ligne)); // repository
```

**Correction.** Séparer création et mapping de persistance ; lister chaque effet
propre à la création.

**Vérification en revue.** Les repositories n'appellent jamais `creer()` ; les
workflows ne construisent jamais directement un nouvel objet.

## TENETS-LIFECYCLE-002 — Création par fabrique nommée (adaptation TypeScript)

`pragmatic` · erreur (réécrit pour TypeScript)

**Règle.** Toute nouvelle entité ou tout nouvel agrégat est créé via sa fabrique
statique `creer()`. Le constructeur est `private` ; ni `new Centre(...)` ni
objet littéral hors de la classe.

**Pourquoi.** Un point d'entrée nommé rend la création explicite et laisse la
reconstitution sur un chemin séparé.

```ts
// ❌ Incorrect
const centre = new Centre(id, nom, StatutCentre.ACTIF);

// ✅ Correct
const centre = Centre.creer({ id, nom, adresse, telephone }, maintenant);
```

**Correction.** Rendre le constructeur `private`, ajouter `creer()` et remplacer
les constructions directes.

**Vérification en revue.** Aucun `new <Agrégat>(` hors de sa propre classe.

## TENETS-LIFECYCLE-003 — La création reçoit l'état initial complet

`pragmatic` · erreur

**Règle.** Le point d'entrée de création reçoit toutes les données disponibles
qui font partie de l'état initial valide.

**Pourquoi.** Une création incomplète disperse la politique d'initialisation et
permet des objets intermédiaires invalides.

```ts
// ❌ Incorrect
const centre = Centre.creer({ id, nom }, maintenant);
centre.changerAdresse(commande.adresse, maintenant);

// ✅ Correct
const centre = Centre.creer({ id, nom, adresse: commande.adresse }, maintenant);
```

**Correction.** Ajouter à `creer()` les données déjà disponibles et construire
l'objet valide en une fois.

**Vérification en revue.** Examiner les mutations qui suivent immédiatement une
création : leur donnée était-elle déjà disponible ?

## TENETS-LIFECYCLE-004 — La création possède ses comportements propres

`pragmatic` · erreur

**Règle.** `creer()` possède la normalisation à la création, l'attribution de
l'identité reçue, les valeurs par défaut, le statut initial et l'enregistrement
de l'événement de création.

**Pourquoi.** Centraliser ces décisions produit des objets cohérents quel que soit le workflow appelant.

```ts
// ❌ Incorrect — dans le use case
const collecte = Collecte.reconstituer({ id, nom, statut: StatutCollecte.PREPARATION /* … */ });

// ✅ Correct
const collecte = Collecte.creer({ id, nom, periode }, maintenant); // statut PREPARATION décidé ici
```

**Correction.** Déplacer les décisions propres à la création depuis les
appelants et constructeurs vers `creer()`.

**Vérification en revue.** Aucun statut initial, valeur par défaut ou événement
de création décidé dans un use case.

> **Identité.** L'identifiant est généré par un port (`GenerateurIdentifiants`,
> TENETS-PORT-004) dans le use case, puis passé à `creer()`. Le domaine ne lit
> ni l'horloge ni l'aléatoire.

## TENETS-LIFECYCLE-005 — La reconstitution rebâtit l'état persisté

`pragmatic` · erreur (réécrit pour TypeScript)

**Règle.** Les adapters de repository reconstruisent les objets en passant
l'identité et l'état persistés explicites à `reconstituer()`. La reconstitution
ne génère pas d'identité, n'applique pas de valeur par défaut et n'enregistre
pas d'événement.

**Pourquoi.** L'état persisté représente un cycle de vie existant, à reconstruire fidèlement.

```ts
// ❌ Incorrect
function hydraterCentre(ligne: CentreRow) {
  return Centre.creer({ nom: ligne.nom }, new Date());
}

// ✅ Correct
function versCentre(ligne: CentreRow): Centre {
  return Centre.reconstituer({
    id: CentreId.creer(ligne.id),
    nom: Nom.creer(ligne.nom),
    statut: versStatutCentre(ligne.statut),
    creeLe: ligne.createdAt,
    modifieLe: ligne.updatedAt,
  });
}
```

**Correction.** Remplacer les appels à `creer()` et les helpers `hydrater*` par
des mappers directionnels `vers<Cible>(source)`.

**Vérification en revue.** Identité et état persistés passés explicitement ; le
nom du mapper indique sa direction.

## TENETS-LIFECYCLE-006 — Une mutation ne termine pas une création

`pragmatic` · erreur

**Règle.** Ne pas créer un objet incomplet puis appeler immédiatement des
mutations pour appliquer des données de création déjà disponibles. Les mutations
restent valables pour les transitions ultérieures ou les informations nouvelles.

**Pourquoi.** Le problème est la création incomplète, pas la mutation.

```ts
// ❌ Incorrect
const benevole = Benevole.creer({ id, identite }, maintenant);
benevole.changerTelephone(commande.telephone, maintenant);

// ✅ Correct
const benevole = Benevole.creer({ id, identite, telephone: commande.telephone }, maintenant);
// Plus tard, sur une vraie demande de modification :
benevole.changerTelephone(nouveauTelephone, maintenant);
```

**Correction.** Déplacer les données initiales dans `creer()` et garder la
mutation pour les transitions ultérieures.

**Vérification en revue.** Comparer les premières opérations après création avec la commande de création.

## TENETS-APP-004 — Les use cases distinguent création et reconstitution

`core` · erreur (réécrit pour TypeScript)

**Règle.** Un use case appelle `creer()` pour un nouvel objet et traite les
résultats du repository comme des objets existants déjà reconstitués.

**Pourquoi.** Recréer un objet chargé peut générer une nouvelle identité,
réinitialiser l'état persisté et émettre de faux événements de création.

```ts
// ❌ Incorrect
const chargee = await this.collecteRepository.get(commande.collecteId);
const collecte = Collecte.creer({ id: chargee!.id, nom: chargee!.nom, periode: chargee!.periode }, maintenant);

// ✅ Correct
const collecte = await this.collecteRepository.get(commande.collecteId);
if (collecte === null) throw new CollecteIntrouvable(commande.collecteId);
collecte.demarrer(maintenant);
```

**Correction.** Supprimer la recréation des résultats du repository et appeler le
comportement directement sur l'agrégat reconstitué.

**Vérification en revue.** Aucun `creer()` dont les entrées proviennent d'un objet renvoyé par un repository.

## TENETS-PATTERN-003 — Points d'entrée de création et de reconstitution (TypeScript)

`pragmatic` · guide (réécrit pour TypeScript)

```ts
// libs/referentiel/domain/src/centre/centre.ts
export interface EtatCentre {
  readonly id: CentreId;
  readonly nom: Nom;
  readonly adresse: Adresse;
  readonly statut: StatutCentre;
  readonly creeLe: Date;
  readonly modifieLe: Date;
}

export class Centre {
  private constructor(
    readonly id: CentreId,
    private nom: Nom,
    private adresse: Adresse,
    private statut: StatutCentre,
    readonly creeLe: Date,
    private modifieLe: Date,
  ) {}

  static creer(params: { id: CentreId; nom: Nom; adresse: Adresse }, maintenant: Date): Centre {
    return new Centre(params.id, params.nom, params.adresse, StatutCentre.ACTIF, maintenant, maintenant);
  }

  static reconstituer(etat: EtatCentre): Centre {
    // Invariants de structure revalidés (ADR-0003 R9) ; pas de valeur par défaut.
    if (etat.modifieLe < etat.creeLe) throw new EtatCentreIncoherent(etat.id);
    return new Centre(etat.id, etat.nom, etat.adresse, etat.statut, etat.creeLe, etat.modifieLe);
  }
}

// libs/referentiel/adapters/src/prisma/centre.mapper.ts
export function versCentre(ligne: CentreRow): Centre {
  return Centre.reconstituer({
    id: CentreId.creer(ligne.id),
    nom: Nom.creer(ligne.nom),
    adresse: Adresse.creer(ligne.adresse, CodePostal.creer(ligne.codePostal), Ville.creer(ligne.ville)),
    statut: versStatutCentre(ligne.statut),
    creeLe: ligne.createdAt,
    modifieLe: ligne.updatedAt,
  });
}
```

Deux chemins explicites : un peu plus de code, mais aucune ambiguïté sur
l'identité, les valeurs par défaut, la validation et les effets de bord.
