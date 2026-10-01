---
paths:
  - 'libs/planification/**/*'
---

# Règles métier — contexte `planification`

Trois plannings par collecte, faits de créneaux affectés à des bénévoles :

| Planning                  | Clé unique         | Lieu     |
| ------------------------- | ------------------ | -------- |
| Planning magasin          | collecte × magasin | magasin  |
| Planning bénévoles centre | collecte × centre  | centre   |
| Planning chauffeur        | collecte × centre  | conduite |

Un créneau est PLANIFIE ou ANNULE. Les règles ci-dessous valent pour les trois
plannings ; seul le code d'erreur change de préfixe en v1 (`PLANNING_MAGASIN_`,
`PLANNING_BENEVOLES_CENTRE_`, `PLANNING_CHAUFFEUR_`).

## RDC-PLANIF-001 — Un planning ne se modifie que lorsque la planification est ouverte

`core` · erreur · ⏳ à implémenter (étape 6)

**Règle.** Créer, annuler ou supprimer un créneau exige que la planification
de la collecte soit ouverte (RDC-COLLECTE-008), information lue dans le
contrat publié par `collecte`. Créer une affectation de planning centre ou
chauffeur exige aussi que le centre soit ACTIF (RDC-REF-010).
Le retrait d'un magasin d'une collecte annule ses créneaux lorsque l'admin le
confirme avec `force=true` (RDC-COLLECTE-004).

**Pourquoi.** L'admin décide quand les centres peuvent engager des bénévoles.

```ts
// ✅ Correct
const contexte = await this.collectes.contextePlanification(collecteId); // port publié
if (!contexte.planificationOuverte) throw new PlanificationFermee(collecteId);
```

**Vérification en revue.** Code v1 : `PLANIFICATION_BENEVOLES_FERMEE`.

**Source v1.** `libs/domain/src/services/planification-collecte.service.ts:6-14`.

## RDC-PLANIF-002 — Un créneau est valide et inclus dans la période de la collecte

`core` · erreur · ⏳ à implémenter

**Règle.** Début < fin. Le créneau est entièrement compris dans la période de
la collecte (fin effective incluse, RDC-COLLECTE-006). Pour un planning
magasin, le magasin doit être inscrit à la collecte.

**Pourquoi.** Un bénévole planifié hors période se présenterait un jour sans
collecte.

```ts
const creneau = Creneau.creer(debut, fin); // CreneauInvalide
if (!contexte.periode.couvre(creneau)) throw new CreneauHorsPeriode();
```

**Vérification en revue.** Codes v1 : `SLOT_HORS_PERIODE_COLLECTE`,
`MAGASIN_NON_INSCRIT`. Un test par type de planning.

**Source v1.** `libs/domain/src/shared/value-objects/creneau-horaire.vo.ts:12-40` ;
`libs/domain/src/collecte/value-objects/periode-collecte.vo.ts:70-89` ;
`libs/domain/src/services/planification-collecte.service.ts:16-55`.

## RDC-PLANIF-003 — Un bénévole n'est jamais sur deux créneaux qui se chevauchent

`core` · erreur · ⏳ à implémenter

**Règle.** Avant d'affecter un créneau, on vérifie les créneaux PLANIFIE du
même planning **et de tous les autres plannings de la collecte** (magasins,
centre, chauffeurs). Sont considérés comme le même bénévole : même identifiant,
**ou** même nom et prénom (rapprochement volontairement large, homonymes
compris). Les créneaux ANNULE sont ignorés. Le chevauchement utilise des bornes
strictes : deux créneaux bout à bout sont autorisés.

**Pourquoi.** Un bénévole ne peut pas être à deux endroits à la fois, et des
doublons d'identité existent dans les données.

```ts
// ❌ Incorrect : seul le planning courant est vérifié
if (this.creneaux.some((c) => c.benevoleId.equals(id) && c.chevauche(creneau))) throw ...;

// ✅ Correct : lecture des autres plannings et écriture dans la même unité de travail, sous verrou
await this.unitOfWork.run(async () => {
  const autres = await this.creneaux.listPlanifiesDeLaCollecte(collecteId);
  planning.affecter({ benevole, creneau, creneauxAutresPlannings: autres }, maintenant);
  await this.plannings.save(planning);
  await this.unitOfWork.commit();
});
```

**Vérification en revue.** Test de chevauchement entre deux plannings,
d'homonymie et de créneaux contigus. Codes v1 :
`*_DEJA_PLANIFIE` et `*_DEJA_PLANIFIE_AILLEURS`. En v1, la
lecture se faisait hors transaction (audit C-03) : double affectation possible
sous concurrence.

**Source v1.** `libs/domain/src/shared/value-objects/creneau-horaire.vo.ts:54-58` ;
`libs/domain/src/planning/benevoles-centre/aggregates/planning-benevoles-centre.aggregate.ts:104-133`.

## RDC-PLANIF-004 — Le type d'engagement est figé dans le créneau

`pragmatic` · erreur · ⏳ à implémenter

**Règle.** À la création d'un créneau, le type d'engagement du bénévole
(`BNV_Restos` / `BNV_1_jour`) est copié dans le créneau.

**Pourquoi.** Les statistiques d'une collecte passée ne changent pas si
l'engagement du bénévole évolue ensuite.

**Vérification en revue.** Les statistiques par engagement lisent l'instantané
du créneau.

**Source v1.** `apps/api/prisma/schema.prisma:261-284`.

## RDC-PLANIF-005 — Une seule implémentation des règles d'affectation

`strict` · recommandation · ⏳ à implémenter

**Règle.** RDC-PLANIF-001 à 004 sont écrites une seule fois et partagées par
les trois plannings.

**Pourquoi.** En v1, trois agrégats quasi identiques dupliquent la détection de
chevauchement : une correction appliquée à un seul fait diverger les autres.

**Vérification en revue.** Modifier une règle d'affectation ne touche qu'un
fichier.

**Source v1.** Duplication constatée dans
`libs/domain/src/planning/magasin/aggregates/planning-magasin.aggregate.ts:75-135`,
`libs/domain/src/planning/benevoles-centre/aggregates/planning-benevoles-centre.aggregate.ts:86-146`
et `libs/domain/src/planning/chauffeur/aggregates/planning-chauffeur.aggregate.ts:108-168`.

## RDC-PLANIF-006 — Un planning référence des bénévoles existants — v2 : selon D-05

`pragmatic` · avertissement · ⚠️ à trancher (D-05)

**Règle.** En v1, les plannings magasin et chauffeur acceptent une identité
saisie en texte libre. Ils recherchent dans le centre concerné par email, puis
téléphone, puis nom-prénom si l'homonyme est unique ; sinon ils créent un
bénévole. Pour le planning magasin, le centre est le centre gestionnaire du
magasin dans la collecte.

**Pourquoi.** Créer des données personnelles en dehors du parcours prévu
empêche d'informer la personne et de l'anonymiser (audit B-03).

**Source v1.**
`apps/api/src/application/use-cases/planning-magasin/planifier-benevoles-magasin.usecase.ts:152-193` ;
`apps/api/src/application/use-cases/planning-chauffeur/planifier-chauffeur.usecase.ts:165-206`.

## RDC-PLANIF-007 — Un bénévole du planning centre appartient à ce centre

`core` · erreur · ⏳ à implémenter (étape 6)

**Règle.** Un créneau du planning bénévoles centre ne peut référencer qu'un
bénévole rattaché à ce même centre. Sinon, l'opération échoue avec
`BENEVOLE_CENTRE_INCOMPATIBLE`. Cette contrainte reste valable quelle que soit la
décision D-05 sur la création implicite des plannings magasin et chauffeur.

**Source v1.**
`apps/api/src/application/use-cases/planning-benevoles-centre/planifier-benevoles-centre.usecase.ts:88-99`.
