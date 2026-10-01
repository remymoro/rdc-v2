---
paths:
  - 'libs/collecte/**/*'
---

# Règles métier — contexte `collecte`

La collecte est le cœur de RDC : son statut, sa période et l'état de saisie de
chaque centre décident de ce que planification et saisie ont le droit de faire.
Ces décisions sont publiées par `collecte` sous forme de contrats
(TENETS-CONTEXT-006) : les autres contextes ne les recalculent jamais.

Cycle de vie :

```text
            demarrer()                          approuverCloture() / terminer()
PREPARATION ──────────► EN_COURS ─────────────────────────────────────► TERMINEE
 (périmètre              │  drapeau enAttenteClotureAdmin (cron)            (planification
  modifiable)            │  saisie de chaque centre :                        fermée)
                         │  EN_COURS → TERMINEE_PAR_CENTRE ⇄ REOUVERTE_PAR_ADMIN
```

## RDC-COLLECTE-001 — Le cycle de vie est linéaire et sans retour

`core` · erreur · ⏳ à implémenter (étape 5)

**Règle.** Une collecte passe uniquement par PREPARATION → EN_COURS → TERMINEE.
Aucune transition arrière n'existe. « En attente de clôture » n'est pas un
statut : c'est le drapeau `enAttenteClotureAdmin` d'une collecte EN_COURS.

**Pourquoi.** Plannings, pesées et statistiques reposent sur ce statut ; un
retour en arrière invaliderait des données terrain déjà produites.

```ts
// ❌ Incorrect
enum StatutCollecte {
  PREPARATION,
  EN_COURS,
  EN_ATTENTE_CLOTURE,
  TERMINEE,
}
collecte.statut = StatutCollecte.PREPARATION; // « rouvrir »

// ✅ Correct : seules les méthodes de l'agrégat changent le statut
collecte.demarrer(maintenant);
collecte.marquerEnAttenteCloture(maintenant); // drapeau, reste EN_COURS
collecte.approuverCloture(maintenant);
```

**Vérification en revue.** Aucun setter de statut ; aucun nouveau statut sans
ADR.

**Source v1.** `libs/domain/src/collecte/aggregates/collecte.aggregate.ts:262-388`.

## RDC-COLLECTE-002 — Une collecte démarre à sa date de début, avec au moins un magasin

`core` · erreur · ⏳ à implémenter

**Règle.** `demarrer(maintenant)` exige le statut PREPARATION, `maintenant >=
dateDebut` et au moins une participation. Une tâche planifiée tente le
démarrage des collectes dont la date est atteinte ; l'admin peut aussi le
déclencher manuellement. Dans les deux cas, les conditions restent vérifiées
par l'agrégat.

**Pourquoi.** Sans magasin, il n'y a pas de terrain ; avant la date, la saisie
s'ouvrirait trop tôt.

```ts
// ❌ Incorrect : conditions recopiées dans la tâche planifiée
if (collecte.participations.length > 0) await prisma.collecte.update({ data: { statut: 'EN_COURS' } });

// ✅ Correct
collecte.demarrer(this.clock.now()); // CollecteDemarreeAvantSaDate, CollecteSansMagasin
```

**Vérification en revue.** Les conditions de démarrage n'existent que dans
`Collecte.demarrer`. Codes v1 : `COLLECTE_STATUT_INVALIDE`,
`COLLECTE_DEMARRAGE_AVANT_DATE_DEBUT`, `COLLECTE_AUCUN_MAGASIN_INSCRIT`.

**Source v1.** `libs/domain/src/collecte/aggregates/collecte.aggregate.ts:262-287` ;
`apps/api/src/infrastructure/tasks/cycle-vie-collecte.task.ts:35-47` ;
`apps/api/src/presentation/http/controllers/collecte.controller.ts:151-157`.

## RDC-COLLECTE-003 — Nom et dates ne changent qu'en préparation, planification fermée

`core` · erreur · ⏳ à implémenter

**Règle.** `modifier()` n'est permis qu'en PREPARATION et quand la
planification est fermée. Après le démarrage, les dates sont figées : une date
de fin erronée se règle par une clôture anticipée (RDC-COLLECTE-005). Une
modification identique ne change rien, pas même `modifieLe`.

**Pourquoi.** Les créneaux et la fenêtre de saisie sont calculés depuis les
dates : les déplacer casserait les plannings existants.

```ts
// ✅ Correct
collecte.modifier({ nom, periode }, maintenant);
// CollecteNonModifiable (COLLECTE_MODIFICATION_INTERDITE)
// CollecteNonModifiablePlanificationOuverte (COLLECTE_MODIFICATION_INTERDITE_PLANIFICATION_OUVERTE)
```

**Vérification en revue.** Aucun use case n'écrit les dates directement ; test
« modification identique → `modifieLe` inchangé ».

**Source v1.** `libs/domain/src/collecte/aggregates/collecte.aggregate.ts:217-260`.

## RDC-COLLECTE-004 — Le périmètre des magasins ne change qu'en préparation

`core` · erreur · ⏳ à implémenter (étape 5) · D-02 décidée

**Règle.** Seul l'admin inscrit, retire un magasin ou réassigne son centre
gestionnaire, et uniquement en PREPARATION. **Inscrire signifie que l'accord du
magasin est obtenu** : une participation n'a pas de statut (D-02). L'accord est
recueilli en amont, dans la liste de vérification (RDC-COLLECTE-014 à 018).
Inscrire un magasin déjà inscrit est sans effet. Retirer ou réassigner un
magasin non inscrit est une erreur (`MAGASIN_NON_INSCRIT`). À l'inscription, le
magasin doit être ACTIF (`MAGASIN_INACTIF`) et son centre de rattachement ne doit
pas être ARCHIVE (`CENTRE_ARCHIVE`, 400) ; un centre INACTIF reste accepté, à la
différence d'un nouveau rattachement (RDC-REF-010). Réassigner vers un centre
ARCHIVE est refusé ; réassigner vers le centre déjà gestionnaire est sans effet.

Retirer un magasin qui possède encore des créneaux PLANIFIE est refusé avec
`MAGASIN_A_DES_SLOTS_ACTIFS` (409), sauf confirmation `force=true`, qui annule
ces créneaux avant le retrait. En v2, cette coordination avec planification passe
par un contrat publié ou un événement (TENETS-CONTEXT-006, TENETS-EVENT-002).

**Pourquoi.** Une fois la collecte démarrée, le terrain est engagé.
Planification, saisie et statistiques ne voient que des magasins engagés et
n'ont donc rien à filtrer.

```ts
// ❌ Incorrect
participations.push({ magasinId, centreId }); // hors agrégat

// ✅ Correct
collecte.inscrireMagasin(magasinId, centreGestionnaireId, maintenant);
collecte.reassignerMagasin(magasinId, autreCentreId, maintenant);
collecte.retirerMagasin(magasinId, maintenant);
```

**Vérification en revue.** Les participations ne se modifient que par l'agrégat
`Collecte`. Codes v1 : `COLLECTE_STATUT_INVALIDE`, `COLLECTE_REASSIGNATION_INTERDITE`.

**Source v1.**
`apps/api/src/application/use-cases/collecte/ajouter-magasin-collecte.usecase.ts:50-74` ;
`apps/api/src/application/use-cases/collecte/reassigner-magasin-collecte.usecase.ts:45-57` ;
`libs/domain/src/collecte/aggregates/collecte.aggregate.ts:412-419` ;
`apps/api/src/application/use-cases/collecte/retirer-magasin-collecte.usecase.ts:41-64`.

## RDC-COLLECTE-005 — La clôture est décidée par l'admin, tous les centres ayant terminé

`core` · erreur · ⏳ à implémenter

**Règle.**

- La tâche planifiée lève seulement `enAttenteClotureAdmin`, quand la fenêtre
  de saisie est dépassée **et** que tous les centres ont déclaré leur saisie
  terminée. Sinon, elle réessaie au passage suivant.
- Le passage à TERMINEE est toujours une action de l'administrateur :
  `approuverCloture` (exige le drapeau) ou `terminer` (clôture anticipée, sans
  attendre la fin de la fenêtre).
- Dans les deux cas, **tous** les centres gestionnaires doivent avoir déclaré
  leur saisie terminée. Il s'agit des centres distincts portés par les
  participations ; un centre sans ligne de saisie vaut EN_COURS et compte donc
  comme incomplet. Les trois workflows renvoient
  `COLLECTE_SAISIES_CENTRES_INCOMPLETES`. Terminer ferme la planification.
- `marquerEnAttenteCloture` est idempotent : un second appel ne modifie pas la
  collecte.

**Pourquoi.** La clôture fige les chiffres des statistiques annuelles : un
humain en porte la responsabilité. La clôture anticipée sert aussi de porte de
sortie quand la date de fin est fausse, puisqu'elle n'est plus modifiable.

```ts
// ❌ Incorrect
if (fenetre.estExpiree(maintenant)) collecte.terminer(maintenant); // dans le cron

// ✅ Correct
// tâche planifiée
if (fenetre.estExpiree(maintenant) && toutesSaisiesTerminees) collecte.marquerEnAttenteCloture(maintenant);
// use case admin
if (!saisies.every((s) => s.estTerminee())) throw new SaisiesCentresIncompletes(collecte.id);
collecte.approuverCloture(maintenant);
```

**Vérification en revue.** Aucun appel à `terminer()` depuis une tâche
planifiée ; chaque use case de clôture vérifie la saisie de tous les centres.
Code v1 : `COLLECTE_CLOTURE_NON_DEMANDEE`.

**Source v1.**
`apps/api/src/application/use-cases/collecte/marquer-en-attente-cloture.usecase.ts:36-51` ;
`apps/api/src/application/use-cases/collecte/approuver-cloture-collecte.usecase.ts:36-51` ;
`apps/api/src/application/use-cases/collecte/terminer-collecte.usecase.ts:36-51` ;
`apps/api/src/infrastructure/queries/collecte-centre-saisie.prisma.query.ts:24-39,63-70` ;
`libs/domain/src/collecte/aggregates/collecte.aggregate.ts:325-338`.

## RDC-COLLECTE-006 — Période : début non passé, fin après début, fin = journée entière

`core` · erreur · ⏳ à implémenter

**Règle.** À la création et à la modification, le jour de début est >=
aujourd'hui, et `dateFin > dateDebut`. Une borne de fin posée à minuit UTC
couvre la journée entière (jusqu'à 23:59:59.999). Cette tolérance est définie
**à un seul endroit** et utilisée par la période comme par la fenêtre de saisie.
La règle « début non passé » ne s'applique pas à la reconstitution (TENETS-LIFECYCLE).

**Pourquoi.** Les utilisateurs saisissent des jours, pas des instants : sans
tolérance, le dernier jour de collecte serait exclu.

```ts
// ❌ Incorrect : tolérance recodée localement
const fin = new Date(dateFin);
fin.setHours(23, 59);

// ✅ Correct
periode.finEffective(); // délègue à finDeJourneeEffective()
```

**Vérification en revue.** Une seule implémentation de la fin de journée
(rechercher `setUTCHours(23` et `setHours(23`). Codes v1 :
`PERIODE_DATE_DEBUT_PASSEE`, `PERIODE_DATE_FIN_INVALIDE`.

**Source v1.** `libs/domain/src/collecte/value-objects/periode-collecte.vo.ts:10-45,66-89` ;
`libs/domain/src/shared/fin-de-journee-effective.ts:1-21`.

## RDC-COLLECTE-007 — La fenêtre de saisie est calculée, jamais stockée comme état

`core` · erreur · ⚠️ à trancher (D-07)

**Règle.** La règle effectivement appliquée en v1 autorise les données seulement
si la collecte est EN_COURS et `maintenant <= dateFinEffective`, ou si l'admin a
rouvert la saisie du centre. La borne de début de `FenetreSaisieCollecte` n'est
pas consultée pour autoriser une pesée. La fenêtre est recalculée depuis
`dateFin` et aucune décision ne lit une colonne « saisie ouverte ». Le document
client prévoit au contraire une `dateFinSaisie` distincte et postérieure à
`dateFin` (D-07).

**Piège v1.** `FenetreSaisieCollecte.saisieEstOuverte()` n'est jamais appelée par
le code applicatif. Si elle l'était, elle n'autoriserait la pesée que le dernier
jour : à la création comme à la modification, `dateDebutSaisie` et
`dateFinSaisie` reçoivent toutes deux `dateFin`.

**Pourquoi.** Deux sources de vérité finissent par diverger.

```ts
// ❌ Incorrect
if (ligne.saisieOuverte) {
  /* autoriser la pesée */
}

// ✅ Correct
collecte.saisieEstOuverte(maintenant);
```

**Vérification en revue.** Pas de colonne d'état dérivé lue par une règle
métier.

**Source v1.**
`libs/domain/src/collecte/aggregates/collecte.aggregate.ts:448-451` ;
`libs/domain/src/services/saisie-collecte.service.ts:20-30` ;
`libs/domain/src/collecte/value-objects/fenetre-saisie-collecte.vo.ts:44-46,59-70` ;
`libs/domain/src/collecte/aggregates/collecte.aggregate.ts:129-132,245-248`.

## RDC-COLLECTE-008 — Ouvrir et fermer la planification

`core` · erreur · ⏳ à implémenter

**Règle.** L'admin ouvre la planification en PREPARATION ou EN_COURS, jamais
sur une collecte TERMINEE. Ouvrir une planification déjà ouverte, ou fermer une
planification déjà fermée, est une **erreur** (pas un no-op), contrairement aux
statuts du référentiel.

**Pourquoi.** L'ouverture autorise les centres à engager des bénévoles : un
double clic doit être signalé, pas ignoré.

```ts
collecte.ouvrirPlanification(maintenant); // PlanificationDejaOuverte, PlanificationImpossible
collecte.fermerPlanification(maintenant); // PlanificationDejaFermee
```

**Vérification en revue.** Codes v1 : `COLLECTE_PLANIFICATION_DEJA_OUVERTE`,
`COLLECTE_PLANIFICATION_DEJA_FERMEE`, `COLLECTE_PLANIFICATION_STATUT_INVALIDE`.
Les noms v1 « ouvrir/fermer les inscriptions » ne sont pas repris.

**Source v1.** `libs/domain/src/collecte/aggregates/collecte.aggregate.ts:289-323`.

## RDC-COLLECTE-009 — Déclarer la saisie d'un centre terminée

`core` · erreur · ⏳ à implémenter

**Règle.** Un centre déclare sa saisie terminée (EN_COURS ou
REOUVERTE_PAR_ADMIN → TERMINEE_PAR_CENTRE) tant que la collecte est EN_COURS,
**même après la fin de la fenêtre** ou pendant l'attente de clôture. C'est une
déclaration, pas une saisie de données. L'auteur et la date sont enregistrés.
Déclarer deux fois est un conflit (`SAISIE_CENTRE_DEJA_TERMINEE`). Le centre doit
gérer au moins un magasin de la collecte, sinon `CENTRE_NON_PARTICIPANT` est
renvoyé. Sans ligne persistée, son état implicite est EN_COURS et la ligne est
créée au premier acte. Hors du statut EN_COURS, l'opération est refusée en 403
avec `COLLECTE_STATUT_INVALIDE_POUR_CONFIRMATION`.

**Pourquoi.** Sinon, une saisie rouverte tardivement ne pourrait plus être
reconfirmée, et la collecte ne pourrait jamais être clôturée.

```ts
// ❌ Incorrect
if (!collecte.saisieEstOuverte(maintenant)) throw ...; // bloque la déclaration

// ✅ Correct
if (collecte.statut !== StatutCollecte.EN_COURS) throw new CollecteNonEnCours(collecte.id);
saisieCentre.declarerTerminee(utilisateurId, maintenant);
```

**Vérification en revue.** La déclaration dépend du seul statut EN_COURS.

**Source v1.**
`apps/api/src/application/use-cases/collecte/marquer-saisie-centre-terminee.usecase.ts:42-81` ;
`apps/api/src/infrastructure/queries/collecte-centre-saisie.prisma.query.ts:24-39`.

## RDC-COLLECTE-010 — Rouvrir la saisie d'un centre : motivé et tracé

`core` · erreur · ⚠️ raison obligatoire à trancher

**Règle.** Seul l'admin rouvre la saisie d'un centre participant, tant que la
collecte est EN_COURS (`COLLECTE_STATUT_INVALIDE_POUR_REOUVERTURE`). En v1, le
domaine exige une raison d'au moins 3 caractères, mais l'API la rend facultative
et le use case fournit « Réouverture par l'administrateur » par défaut. La v2
doit décider si l'admin doit réellement saisir cette raison (D-13). L'auteur, la
date et la raison retenue sont conservés. Rouvrir une saisie déjà rouverte est un
conflit (`SAISIE_CENTRE_DEJA_ROUVERTE`). Sans ligne persistée, elle est créée au
premier acte.

**Pourquoi.** Les chiffres d'une collecte sont rapportés à l'association :
chaque réouverture doit pouvoir être justifiée.

```ts
saisieCentre.rouvrir(adminId, raison, maintenant); // RaisonReouvertureInvalide
```

**Vérification en revue.** L'état de saisie d'un centre ne change que par
`declarerTerminee` / `rouvrir`. Code v1 : `SAISIE_CENTRE_RAISON_REOUVERTURE_INVALIDE`.

**Source v1.** `libs/domain/src/collecte/saisie-centre.entity.ts:145-165` ;
`apps/api/src/application/use-cases/collecte/reouvrir-saisie-centre.usecase.ts:43-80` ;
`apps/api/src/presentation/http/dtos/requests/reouvrir-saisie-centre.request.ts:1-8`.

## RDC-COLLECTE-011 — Forcer la fin de saisie d'un centre injoignable

`pragmatic` · avertissement · ⏳ à implémenter

**Règle.** En dernier recours, l'admin déclare la saisie d'un centre terminée à
sa place pour débloquer la clôture. La collecte doit être EN_COURS
(`COLLECTE_STATUT_INVALIDE_POUR_CONFIRMATION`) et le centre doit participer
(`CENTRE_NON_PARTICIPANT`). L'identité de l'admin est enregistrée comme auteur ;
la ligne est créée si elle n'existe pas encore.

**Pourquoi.** La clôture ne doit pas dépendre d'un centre absent, mais la trace
doit montrer qui a décidé.

**Vérification en revue.** Route réservée à l'ADMIN, avec un test « refusé »
pour un responsable.

**Source v1.**
`apps/api/src/application/use-cases/collecte/forcer-validation-saisie-centre.usecase.ts:49-83`.

## RDC-COLLECTE-012 — Le nom d'une collecte est unique

`pragmatic` · erreur · ⏳ à implémenter

**Règle.** Deux collectes ne portent pas le même nom. Le use case vérifie
avant d'écrire, et la contrainte unique en base est traduite en
`CollecteDejaExistante` (TENETS-ADAPTER-006).

**Source v1.** `apps/api/prisma/schema.prisma:106-126` (`Collecte.nom @unique`).

## RDC-COLLECTE-013 — Contrats publiés aux autres contextes

`core` · erreur · ⏳ à implémenter

**Règle.** `collecte` publie, sous forme de port ou de requête de lecture, les
réponses dont planification, saisie, référentiel et identité-accès ont besoin :

| Question                                                                     | Utilisée par                       |
| ---------------------------------------------------------------------------- | ---------------------------------- |
| Le magasin M est-il inscrit à la collecte C ?                                | planification, saisie              |
| Quel est le centre gestionnaire de M pour C ?                                | saisie, identite-acces (périmètre) |
| La planification de C est-elle ouverte ? Sa période ?                        | planification                      |
| Le centre X peut-il peser dans C maintenant ?                                | saisie                             |
| Le centre X gère-t-il un magasin dans une collecte PREPARATION ou EN_COURS ? | referentiel (RDC-REF-004)          |

**Pourquoi.** Ces règles existent une seule fois ; en v1, elles étaient
recopiées dans plusieurs use cases et un service de présentation (audit C-04).

**Vérification en revue.** Aucun autre contexte n'importe l'agrégat `Collecte`
(TENETS-CONTEXT-002).

## RDC-COLLECTE-022 — Une seule collecte par année

`core` · erreur · ⏳ à implémenter (lot 2) · D-12 décidée (ADR-0016)

**Règle.** La date de début détermine l'année de la collecte. Créer ou modifier
une collecte vers une année déjà occupée est refusé avec
`COLLECTE_ANNEE_DEJA_EXISTANTE`. Cette unicité rend possible la comparaison
N/N-1. La v1 n'emploie toutefois pas le même fuseau partout : le use case utilise
`getFullYear()` et le repository construit des bornes UTC. **Décision D-12 :**
la v2 prend l'année civile Europe/Paris de la date de début, avec une seule
fonction pour l'unicité et les statistiques N/N-1.

**Source v1.**
`apps/api/src/application/use-cases/collecte/creer-collecte.usecase.ts:24-33` ;
`apps/api/src/application/use-cases/collecte/modifier-collecte.usecase.ts:36-43` ;
`apps/api/src/infrastructure/repositories/collecte.prisma.repository.ts:145-157`.

## Préparation : vérifier la participation des magasins, puis inscrire

Décidé le 2026-10-01 (D-02). Le circuit suit l'organisation réelle :

```text
1. Admin du siège AD47 : ouvre la vérification de la collecte (RDC-COLLECTE-014)
      → une liste par centre, préremplie
2. Responsable de centre : envoie ses bénévoles vers les magasins (hors application)
3. Bénévole : demande au magasin « participez-vous ? » → oui / non
4. Responsable de centre : saisit les réponses (RDC-COLLECTE-015)
5. Responsable de centre : transmet sa liste au siège, avec son avis (RDC-COLLECTE-020)
      ↺ le siège peut la lui renvoyer pour correction (RDC-COLLECTE-021)
6. Admin du siège : inscrit les magasins qui participent, en lot (RDC-COLLECTE-017)
7. Admin du siège : ferme la vérification, ou démarrage → listes figées (RDC-COLLECTE-018)
```

États d'une liste de vérification, comme pour la saisie d'un centre :

```text
EN_COURS ──transmettre()──► TRANSMISE ──renvoyer(raison)──► RENVOYEE ──transmettre()──► TRANSMISE
 (le centre saisit)          (le siège décide)              (le centre corrige)
```

Trois concepts distincts : le **magasin** (referentiel, permanent), la
**vérification** (préparation d'une collecte), la **participation**
(engagement). Les réponses ne sont jamais un statut de la participation.

Livraison : temps 1 avec l'étape 5 (inscription manuelle et reprise de la
collecte précédente, RDC-COLLECTE-019) ; temps 2 juste après l'étape 4
(vérification, RDC-COLLECTE-014 à 018, 020, 021). Le temps 2 s'ajoute sans
modifier le temps 1.

## RDC-COLLECTE-014 — Le siège ouvre la vérification : une liste préremplie par centre

`core` · erreur · ⏳ à implémenter (temps 2) · à présenter au client

**Règle.** L'admin du siège ouvre la vérification d'une collecte en
PREPARATION, une seule fois. L'ouverture crée une liste de vérification pour
chaque centre actif, avec **tous les magasins actifs rattachés** au centre
(contrat publié par `referentiel`). Chaque magasin a la réponse « à contacter »
et l'indication « a participé à la collecte précédente ». Tant que la
vérification est ouverte, l'admin peut ajouter à une liste un magasin créé ou
réactivé depuis.

**Pourquoi.** C'est le siège qui lance la campagne. Un nouveau magasin entre
automatiquement dans la liste, et un magasin qui a sauté une année n'est pas
oublié.

```ts
// ✅ Correct : une liste = un agrégat par couple (collecte, centre)
collecte.ouvrirVerification(maintenant); // VerificationDejaOuverte, CollecteNonEnPreparation
const listes = magasinsParCentre.map(({ centreId, magasins }) => ListeVerification.creer({ collecteId, centreId, magasins, participantsPrecedents }, maintenant));
```

**Vérification en revue.** La liste est un agrégat séparé de `Collecte`
(TENETS-AGGREGATE-003) : les responsables de plusieurs centres saisissent en
même temps, sans conflit d'écriture sur la collecte. L'ouverture et la création
des listes se font dans la même unité de travail.

## RDC-COLLECTE-015 — Le responsable du centre saisit les réponses des magasins

`core` · erreur · ⏳ à implémenter (temps 2)

**Règle.** Une réponse vaut « à contacter », « participe » ou « ne participe
pas », avec un commentaire facultatif. Elle est saisie par le responsable du
centre de la liste, uniquement pour son centre (RDC-ACCES-002), quand la liste
est EN_COURS ou RENVOYEE et que la vérification est ouverte. L'auteur et la
date de la dernière réponse sont conservés. Les bénévoles ne sont pas des
utilisateurs : le responsable saisit ce qu'ils lui rapportent.

**Pourquoi.** Aujourd'hui, les réponses passent du bénévole au centre puis au
siège hors application, et sont ressaisies : des informations se perdent.

```ts
// ❌ Incorrect : une réponse portée par la participation
participation.statut = 'CONFIRME';

// ✅ Correct
liste.repondre(magasinId, ReponseMagasin.PARTICIPE, { auteur: utilisateurId, commentaire }, maintenant);
// MagasinHorsListe, ListeDejaTransmise, VerificationFermee
```

**Vérification en revue.** Tests « responsable d'un autre centre → refusé » et
« liste transmise → réponse refusée ».

## RDC-COLLECTE-016 — Qui voit quoi

`pragmatic` · erreur · ⏳ à implémenter (temps 2)

**Règle.** Le responsable voit la liste de son centre. L'admin du siège voit
l'avancement de tous les centres : état de chaque liste (en cours, transmise,
renvoyée), et nombre de magasins qui participent, ne participent pas ou restent
à contacter, avec le détail et l'avis du centre. Ce sont des lectures.

**Pourquoi.** Le siège sait quels centres relancer ; le centre sait ce qu'il
lui reste à faire.

## RDC-COLLECTE-017 — Le siège inscrit les magasins à partir des listes transmises

`core` · erreur · ⏳ à implémenter (temps 2)

**Règle.** Seul l'admin inscrit (RDC-COLLECTE-004). L'**inscription en lot**
inscrit, pour une liste TRANSMISE, les magasins dont la réponse est
« participe » et qui ne sont pas encore inscrits ; le centre gestionnaire est
celui de la liste. Relancer l'inscription en lot ne crée pas de doublon. Une
liste non transmise ne s'inscrit pas en lot. L'admin peut toujours inscrire un
magasin un par un, y compris hors liste : c'est sa décision, et la liste n'est
pas modifiée.

**Pourquoi.** La transmission est le moment où le centre engage sa réponse ;
le siège garde la décision sur le périmètre de la collecte.

```ts
// ✅ Correct : un seul use case, une seule unité de travail
if (!liste.estTransmise()) throw new ListeNonTransmise(liste.centreId);
for (const magasinId of liste.magasinsQuiParticipent()) {
  collecte.inscrireMagasin(magasinId, liste.centreId, maintenant);
}
```

**Vérification en revue.** Aucune participation n'est créée depuis une liste
sans action de l'admin.

## RDC-COLLECTE-018 — Fin de la vérification : listes figées, démarrage non bloqué

`core` · erreur · ⏳ à implémenter (temps 2)

**Règle.** L'admin ferme la vérification quand il a ce qu'il lui faut ; le
démarrage de la collecte la ferme aussi. Ensuite, aucune liste n'est plus
modifiable : elles deviennent l'historique des réponses de la collecte. Des
listes non transmises ou des magasins « à contacter » **n'empêchent pas** le
démarrage (RDC-COLLECTE-002 reste la seule condition) : l'admin voit un
avertissement avant de démarrer.

**Pourquoi.** Un centre ou un magasin qui ne répond pas ne doit pas bloquer
tout le département ; l'historique sert à préparer la collecte suivante.

## RDC-COLLECTE-019 — Reprendre les participants de la collecte précédente

`pragmatic` · erreur · ⏳ à implémenter (temps 1, étape 5)

**Règle.** En PREPARATION, l'admin peut inscrire en une fois les magasins qui
participaient à la collecte précédente, s'ils sont toujours actifs, avec leur
centre de rattachement actuel comme centre gestionnaire. Les magasins déjà
inscrits ne sont pas dupliqués. La « collecte précédente » est la dernière
collecte TERMINEE par date de début, pas « l'année N-1 ».

**Pourquoi.** C'est le préremplissage minimal, disponible avant les listes de
vérification. La définition par date reste explicite même si la règle actuelle
n'autorise qu'une collecte par année (RDC-COLLECTE-022).

## RDC-COLLECTE-020 — Le centre transmet sa liste au siège, avec son avis

`core` · erreur · ⏳ à implémenter (temps 2)

**Règle.** Le responsable transmet la liste de son centre au siège
(EN_COURS ou RENVOYEE → TRANSMISE), avec un avis facultatif : un commentaire
global du centre. La transmission est possible même s'il reste des magasins
« à contacter » : ils apparaissent au siège comme non vérifiés. L'auteur et la
date de transmission sont conservés. Transmettre une liste déjà transmise est
un conflit (`LISTE_DEJA_TRANSMISE`). Après transmission, le centre ne modifie
plus ses réponses.

**Pourquoi.** C'est le retour officiel du centre vers le siège : à partir de
là, le siège peut décider sur une réponse stable.

```ts
liste.transmettre({ auteur: responsableId, avis }, maintenant); // ListeDejaTransmise, VerificationFermee
```

**Vérification en revue.** Transmission réservée au responsable du centre de
la liste (ou à l'admin), test « autre centre → refusé ».

## RDC-COLLECTE-021 — Le siège peut renvoyer une liste au centre

`pragmatic` · erreur · ⏳ à implémenter (temps 2)

**Règle.** L'admin renvoie une liste TRANSMISE à son centre (→ RENVOYEE), avec
une raison obligatoire d'au moins 3 caractères, conservée avec l'auteur et la
date. Le centre peut alors corriger ses réponses, puis transmettre de nouveau.
Les magasins déjà inscrits ne sont pas retirés automatiquement.

**Pourquoi.** Le siège peut demander une précision (magasin oublié, réponse
douteuse) sans tout ressaisir lui-même. Même logique que la réouverture de
saisie (RDC-COLLECTE-010).

```ts
liste.renvoyer({ auteur: adminId, raison }, maintenant); // ListeNonTransmise, RaisonRenvoiInvalide
```
