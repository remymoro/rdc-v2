---
paths:
  - 'docs/domaine/**/*'
---

# Décisions métier à trancher

Contradictions relevées entre le code de RDC v1, sa documentation
(`docs/architecture/regles-metier-validation.md`, soumise au client) et ses
audits. Une règle marquée ⚠️ n'est pas implémentée tant que sa décision n'est
pas prise.

Une fois la décision prise : noter la décision et sa date ici, mettre à jour la
règle concernée (état ⏳), et écrire un ADR si elle s'écarte de la v1.

| ID   | Sujet                                       | Règles                           | Bloque l'étape |
| ---- | ------------------------------------------- | -------------------------------- | -------------- |
| D-01 | Ordre interne de l'étape 6                  | —                                | 6              |
| D-02 | ✅ Décidée : vérification, puis inscription | RDC-COLLECTE-004, 014 à 021      | —              |
| D-03 | Magasin engagé dans une collecte active     | RDC-REF-006                      | 5              |
| D-04 | ✅ Décidée : convention v1                  | RDC-REF-009, RDC-STATS-003       | —              |
| D-05 | Bénévole créé depuis un planning            | RDC-PLANIF-006, RDC-BENEVOLE-005 | 6              |
| D-06 | Conservation et traçabilité RGPD            | RDC-BENEVOLE-004, RDC-ACCES-008  | 4 et 6         |
| D-07 | Fenêtre de saisie                           | RDC-COLLECTE-007                 | 5              |
| D-08 | Sens de la validation d'une pesée           | RDC-SAISIE-004, RDC-STATS-005    | 6              |
| D-09 | Changement de mot de passe en libre-service | RDC-ACCES-009                    | 4              |
| D-10 | Centre crédité des poids                    | RDC-STATS-006                    | 7              |
| D-11 | Référence produit libre ou catalogue        | RDC-SAISIE-005                   | 6              |
| D-12 | ✅ Décidée : année civile Europe/Paris      | RDC-COLLECTE-022                 | —              |
| D-13 | Raison de réouverture réellement saisie     | RDC-COLLECTE-010                 | 5              |
| D-18 | ✅ Décidée : archiver un centre vide        | RDC-REF-011                      | —              |

## D-01 — Ordre des étapes

**Constat.** La feuille de route place bénévoles, planification et saisie dans
la même étape 6, après collecte (étape 5). Leur ordre interne n'est pas fixé :
planification dépend de bénévoles, et planification comme saisie dépendent des
contrats publiés par collecte (RDC-COLLECTE-013).

**Proposition.** referentiel → identite-acces → collecte → benevoles →
planification → saisie → statistiques. Bénévoles peut aussi venir plus tôt :
il ne dépend que de referentiel et d'identite-acces.

## D-02 — Une participation a-t-elle un statut ?

**Décision (2026-10-01).** Non : option (c). Inscrire un magasin veut dire que
son accord est obtenu. L'accord est recueilli avant : le siège ouvre la
vérification (une **liste de vérification** préremplie par centre), le
responsable envoie ses bénévoles et saisit les réponses, puis transmet sa
liste au siège avec son avis ; le siège peut la renvoyer pour correction, puis
inscrit les « participe » en lot. Règles : RDC-COLLECTE-004 et
RDC-COLLECTE-014 à 021. À présenter au client : c'est
désormais le responsable qui saisit les réponses dans RDC.

Éléments qui ont conduit à la décision :

**Constat.**

- Document `regles-metier-validation.md` (v1, non versionné, modifié le
  2026-06-30) : participation EN_ATTENTE / CONFIRME / REFUSE ; une collecte
  démarre s'il y a « au moins 1 magasin **confirmé** ». Il était « destiné à
  être soumis au client » : rien n'indique qu'il ait été validé.
- Code v1 : simple inscription sans statut ; démarre s'il y a au moins un
  magasin **inscrit**. `CLAUDE.md` v1 : « pas de notion de confirmation ».

**Historique v1 (git).** Le statut a existé, puis a été retiré volontairement :

| Date       | Commit    | Fait                                                                         |
| ---------- | --------- | ---------------------------------------------------------------------------- |
| 2026-04-09 | `0a4e6f5` | `StatutParticipation` présent dans le domaine                                |
| 2026-06-19 | `173bf5b` | Suppression de `confirmer()` et `refuser()`                                  |
| 2026-06-30 | —         | Dernière modification du document, qui décrit encore la confirmation         |
| 2026-07-01 | `45e8e7d` | Suppression du statut « inutilisé » de participation et de `SAISIE_EN_COURS` |

Le document est donc une photo d'un modèle abandonné, pas une cible.

**La vraie question métier.** Que représente « confirmé » sur le terrain ? Le
magasin a donné son accord pour accueillir la collecte. Questions au client :

1. Qui obtient cet accord, et qui le saisit ? L'admin, le centre ? Le magasin
   n'utilise pas l'application.
2. Entre inscription et accord, peut-on déjà planifier des bénévoles dans ce
   magasin ?
3. Un refus doit-il être conservé (« ce magasin a refusé en 2026 », utile pour
   relancer l'année suivante) ? Ou suffit-il de retirer le magasin ?
4. Aujourd'hui, inscrit-on un magasin avant d'avoir son accord ?

**Options.**

- (a) **Pas de statut** (v1 actuelle) : inscrire = accord obtenu ; un refus =
  on n'inscrit pas, ou on retire.
- (b) **Statut sur la participation** : EN_ATTENTE / CONFIRME / REFUSE. Chaque
  contexte doit alors filtrer : démarrage, planning, pesée et statistiques
  n'acceptent que les magasins confirmés.
- (c) **Deux concepts séparés** : la participation reste sans statut, et un
  futur concept de « démarchage » (contacts, accords, refus d'une collecte à
  l'autre) suit la prospection des magasins.

**Recommandation.** (a) maintenant. Si la réponse 3 est « oui », (c) plus tard
plutôt que (b).

- Le statut a été retiré de la v1 parce qu'il ne servait pas.
- (a) → (b) reste possible plus tard : une migration ajoute la colonne avec
  CONFIRME par défaut, sans casser l'existant. L'inverse oblige à retirer des
  filtres dans quatre contextes.
- (b) mélange deux choses : l'engagement terrain de la collecte et le suivi
  commercial des magasins. Si le client veut garder la trace des refus, c'est
  un concept à part (c).

## D-03 — Désactiver ou archiver un magasin engagé dans une collecte active

**Report (2026-10-01).** La règle a besoin de savoir si un magasin participe à
une collecte active : elle dépend donc de `collecte`. Comme RDC-REF-004 pour le
centre, elle est **reportée à l'étape 5**. L'étape 3 se fait sans elle. Le choix
entre (a) et (b) reste ouvert et bloque désormais l'étape 5, pas l'étape 3.

**Constat.**

- Document client : en PREPARATION, autorisé, avec **retrait automatique** du
  magasin de la collecte ; bloqué en EN_COURS.
- Code v1 : bloqué en PREPARATION comme en EN_COURS
  (`MAGASIN_COLLECTES_EN_COURS`).

**Options.** (a) Blocage, comme le code v1 et comme le centre. (b) Retrait
automatique en préparation, comme le document client.

**Impact de (b).** Opération sur deux contextes (referentiel et collecte) :
il faut un événement « magasin désactivé » consommé par collecte, ou un use
case de coordination.

## D-04 — L'enseigne est-elle une donnée ?

**Décision (2026-10-01).** Option (a) : convention v1, l'enseigne est le nom du
magasin normalisé par `UPPER(TRIM(nom))`. Le magasin de l'étape 3 n'a pas de
champ `enseigne`. Si le besoin apparaît, un champ s'ajoutera par une migration
qui recopie le nom actuel, sans casser l'existant.

**Constat.** En v1, l'enseigne est le nom du magasin normalisé par
`UPPER(TRIM(nom))` : casse et espaces aux extrémités sont ignorés, mais les
espaces internes comptent. Un magasin peut s'appeler « Leclerc Agen Sud » ; il
forme alors une enseigne distincte de « Leclerc ».

**Options.** (a) Convention v1. (b) Attribut `enseigne` du magasin, avec
reprise des données (enseigne = nom actuel).

## D-05 — Bénévole créé depuis un planning

**Constat.** En v1, saisir une personne inconnue dans un planning magasin ou
chauffeur crée un bénévole (`findOrCreate`) dans le centre concerné, hors du
parcours bénévole (audit B-03). Le rapprochement se fait par email, puis
téléphone, puis homonyme unique. Le planning magasin crée ce bénévole sans
vérifier que le centre gestionnaire est ACTIF, contrairement aux autres nouveaux
rattachements (`CENTRE_NON_ACTIF`, RDC-REF-010).

**Sources v1.**
`apps/api/src/application/use-cases/planning-magasin/planifier-benevoles-magasin.usecase.ts:122-126,181-192` ;
`apps/api/src/application/use-cases/planning-chauffeur/planifier-chauffeur.usecase.ts:165-206`.

**Options.** (a) Le planning n'accepte que des bénévoles existants. (b) La
création reste possible depuis le planning, mais passe par le use case de
création de bénévole, avec les mêmes contrôles.

## D-06 — Conservation et traçabilité des données personnelles

**Constat.** Aucune purge ni anonymisation automatique (audit B-02), et aucun
journal des accès ou modifications (audit A-04 / B-01).

**À décider.** Durée de conservation par type d'engagement ; contenu, durée et
consultation du journal d'audit. Question pour le responsable des traitements
de l'association.

## D-07 — Fenêtre de saisie

**Constat.**

- Document client : une `dateFinSaisie` postérieure à la date de fin de
  collecte. Il mentionne aussi un statut de collecte `SAISIE_EN_COURS`, qui
  n'existe pas.
- Code v1 : la fenêtre est recalculée à partir de `dateFin` (fin de saisie =
  fin de collecte, jusqu'à 23:59:59). La colonne `dateFinSaisie` existe en
  base mais n'est pas la source de la règle. Les centres en retard passent par
  une réouverture de l'admin.

**Options.** (a) Comportement du code v1. (b) Délai de saisie configurable
après la fin de collecte (date saisie par l'admin, ou nombre de jours fixe).

## D-08 — Que change la validation d'une pesée ?

**Constat.** Une pesée passe EN_COURS → VALIDEE, et valider deux fois est une
erreur. Mais les statistiques v1 comptent **toutes** les pesées, validées ou
non. On ne voit pas ce que la validation empêche ou permet.

**À décider.** Une pesée validée est-elle encore modifiable ? Les statistiques
ne comptent-elles que les pesées validées ? Faut-il valider toutes ses pesées
avant de déclarer la saisie du centre terminée ?

## D-09 — Changement de mot de passe en libre-service

**Constat.** En v1, seul l'admin modifie le mot de passe d'un responsable
(audit A-02). Décision v1 du 2026-08-24 : non implémenté, car le déploiement
cible était un NAS local non exposé à Internet.

**À décider.** Le déploiement cible de la v2 est-il toujours ce NAS ? Si l'API
est exposée sur Internet, le libre-service redevient nécessaire.

## D-10 — Quel centre est crédité des poids ?

**Constat.** La v1 attribue tantôt les poids au centre gestionnaire de la
participation (`ParticipationMagasin.centreId`), tantôt au centre de rattachement
permanent (`Magasin.centreId`). L'incohérence existe jusque dans la même fonction
`fetch()` : le total par centre passe par la participation, tandis que sa série
journalière passe par le magasin. Les statistiques dédiées à un centre reviennent
à la participation ; la comparaison annuelle utilise le rattachement permanent.

**À décider.** Retenir le centre gestionnaire, le centre de rattachement, ou
présenter explicitement les deux axes. La décision doit être identique dans tous
les écrans et exports.

**Sources v1.**
`apps/api/src/infrastructure/queries/global-stats.prisma.query.ts:1040-1072`
(synthèse par participation) ;
`apps/api/src/infrastructure/queries/global-stats.prisma.query.ts:665-684`
(série journalière par magasin) ;
`apps/api/src/infrastructure/queries/global-stats.prisma.query.ts:1836-1853`
(statistiques d'un centre par participation) ;
`apps/api/src/infrastructure/queries/comparaison-annuelle.prisma.query.ts:186-204`.

## D-11 — Référence produit libre ou catalogue obligatoire ?

**Constat.** En v1, référence, famille et sous-famille viennent du client sans
contrôle catalogue. `ReferenceProduit` est libre (50 caractères au plus) et
distincte de `CodeProduit`.

**À décider.** Conserver la référence libre pour ne pas bloquer le terrain, ou
exiger un produit du catalogue et prévoir un parcours explicite pour les produits
inconnus.

**Sources v1.**
`apps/api/src/application/use-cases/saisie/creer-saisie-entry.usecase.ts:101-113` ;
`libs/domain/src/produit/value-objects/reference-produit.vo.ts:3-20`.

## D-12 — Quel fuseau définit l'année d'une collecte ?

**Décision (2026-10-01).** Année civile **Europe/Paris** : l'année d'une
collecte est celle de sa date de début, lue à l'heure de Paris. La même fonction
sert à l'unicité annuelle (RDC-COLLECTE-022) et aux statistiques N/N-1. Les
bornes d'une année en base sont le 1er janvier à 0 h, heure de Paris, converties
en UTC, et non `Date.UTC`. Écart à la v1 enregistré par l'**ADR-0016**.

**Constat.** Les use cases v1 utilisent `dateDebut.getFullYear()` alors que le
repository recherche entre deux bornes construites avec `Date.UTC`. Une date
proche du changement d'année peut donc être classée différemment selon le fuseau
du processus.

**Options étudiées.** Année civile `Europe/Paris` (usage métier, retenue) ou
année UTC.

**Sources v1.**
`apps/api/src/application/use-cases/collecte/creer-collecte.usecase.ts:24-33` ;
`apps/api/src/application/use-cases/collecte/modifier-collecte.usecase.ts:36-43` ;
`apps/api/src/infrastructure/repositories/collecte.prisma.repository.ts:145-157`.

## D-13 — La raison de réouverture doit-elle être saisie ?

**Constat.** Le domaine v1 exige au moins 3 caractères, mais la requête HTTP rend
la raison facultative et le use case fournit une phrase par défaut.

**À décider.** Exiger une justification réellement saisie par l'admin, ou
assumer une raison technique par défaut.

**Sources v1.** `libs/domain/src/collecte/saisie-centre.entity.ts:145-159` ;
`apps/api/src/application/use-cases/collecte/reouvrir-saisie-centre.usecase.ts:79-80` ;
`apps/api/src/presentation/http/dtos/requests/reouvrir-saisie-centre.request.ts:1-8`.

## D-18 — Archiver un centre qui a encore des magasins

**Décision (2026-10-02).** Option (a) : l'archivage est **refusé** tant que le
centre a au moins un magasin non archivé (`CENTRE_A_DES_MAGASINS`, 409).
L'admin transfère ou archive d'abord ces magasins. La désactivation reste
permise : elle est réversible, et les magasins gardent leur rattachement
pendant la pause (RDC-REF-010 empêche déjà tout nouveau rattachement).

**Constat.** Rien n'empêchait d'archiver un centre dont des magasins actifs
restent rattachés : ces magasins dépendraient pour toujours d'un centre qui
n'opère plus, sans pouvoir y être rattachés à nouveau. La documentation v1
reprise ici ne mentionne pas ce cas.

**Options.** (a) Refuser l'archivage. (b) Obliger un transfert dans la même
opération. (c) Archiver les magasins en cascade.

**Pourquoi (a).** Simple, explicite, sans effet caché ; (c) archiverait des
magasins encore utiles, et (b) mélange deux décisions en une.
