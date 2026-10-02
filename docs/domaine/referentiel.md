---
paths:
  - 'libs/referentiel/**/*'
---

# Règles métier — contexte `referentiel`

Centres, magasins et produits : les données de référence que les collectes
utilisent. Statuts d'un centre ou d'un magasin :

```text
ACTIF ⇄ INACTIF
  └──────┴──► ARCHIVE   (terminal : plus aucun changement)
```

## RDC-REF-001 — Un centre est unique par nom et adresse

`core` · erreur · ✅ création (centre, magasin) · ✅ filet P2002 (magasin) · ⏳ filet P2002 (centre) et modification

**Règle.** Deux centres ne partagent pas la même clé de doublon (nom, adresse,
code postal, ville, normalisés comme en v1 : `CleDoublonCentre`). Le use case
vérifie avant d'écrire, dans l'unité de travail ; la contrainte unique en base
sert de filet et doit être traduite en `CentreDejaExistant`
(`CENTRE_ALREADY_EXISTS`, 409). La même règle s'applique aux magasins
(`CleDoublonMagasin`, `MagasinDejaExistant`, `MAGASIN_ALREADY_EXISTS`, 409),
avec une clé globale qui ne contient pas le centre de rattachement.

**Pourquoi.** Les doublons faussent les statistiques par centre et par magasin.

**Vérification en revue.** Aucune erreur Prisma P2002 ne remonte brute à l'API
(reste à faire, voir `docs/roadmap.md`).

**Source v1.** `apps/api/prisma/schema.prisma:12-33` ;
`apps/api/src/application/use-cases/centre/modifier-centre.usecase.ts:48-58`.

## RDC-REF-002 — Un élément archivé ne change plus jamais d'état

`core` · erreur · ✅ centre et magasin (domaine, application, HTTP)

**Règle.** Centre et magasin : ACTIF ⇄ INACTIF, et archivage possible depuis
les deux. Désactiver un inactif, activer un actif ou archiver un archivé est
sans effet (et ne change pas `modifieLe`). Activer, désactiver ou modifier un
élément archivé est un **conflit** (`CENTRE_ARCHIVED` / `MAGASIN_ARCHIVED`, 409).

**Pourquoi.** L'archive préserve l'historique administratif référencé par les
collectes passées.

```ts
// ❌ Incorrect
if (centre.statut === StatutCentre.ARCHIVE) centre.statut = StatutCentre.ACTIF;

// ✅ Correct
centre.archiver(maintenant);
centre.activer(maintenant); // lève CentreArchive
```

**Vérification en revue.** L'erreur d'archivage est traduite en 409, pas en 400.

**Source v1.** `libs/domain/src/centre/centre.entity.ts:152-195` ;
`libs/domain/src/magasin/magasin.entity.ts:167-205`.

## RDC-REF-003 — Coordonnées valides et complètes

`core` · erreur · ✅ implémentée (étape 1)

**Règle.**

- Téléphone : facultatif ; séparateurs retirés, format `+33` + 9 chiffres,
  préfixes 01-07 et 09 uniquement (ADR-0007).
- Email : facultatif ; non vide, valide, normalisé, 254 caractères au plus.
- Adresse : non vide, 255 caractères au plus, sans abréviation de voie, mot à
  mot, 19 abréviations (ADR-0006).
- Code postal : 5 chiffres.
- Une chaîne vide reçue en HTTP pour un champ facultatif = champ absent (ADR-0007).

**Pourquoi.** Ces coordonnées servent réellement à joindre centres, magasins et
bénévoles.

**Vérification en revue.** Les DTO HTTP ne vérifient que la forme ; les règles
sont dans les value objects (TENETS-VALIDATE-002). Les refus voulus (« rue du
Lot », numéros 0800) ne sont pas des défauts.

**Source v1.** `libs/domain/src/shared/value-objects/telephone.vo.ts:6-35` ;
`libs/domain/src/shared/value-objects/email.vo.ts:8-32` ;
`libs/domain/src/shared/value-objects/adresse.vo.ts:3-58`.

## RDC-REF-004 — Le statut d'un centre est figé pendant ses collectes actives

`core` · erreur · 🔁 reportée à l'étape 5 (décision du 2026-10-01)

**Règle.** Activer, désactiver ou archiver un centre est refusé s'il est
centre gestionnaire d'un magasin dans une collecte PREPARATION ou EN_COURS.
L'admin doit d'abord retirer ou réassigner les magasins à la main. La réponse
vient du contrat publié par `collecte` (RDC-COLLECTE-013).

**Pourquoi.** Un centre gère plusieurs magasins : un retrait automatique aurait
un impact trop large.

**Vérification en revue.** Code v1 :
`CENTRE_STATUT_MODIFICATION_INTERDITE_COLLECTES_ACTIVES` (400).

**Source v1.** `libs/domain/src/services/centre-lifecycle.service.ts:4-21` ;
`apps/api/src/infrastructure/repositories/collecte.prisma.repository.ts:103-122`.

## RDC-REF-005 — Un magasin est rattaché à un centre

`core` · erreur · ✅ création et transfert (étape 3, A1 et A3)

**Règle.** Tout magasin a un centre de rattachement. Le transfert de
rattachement vers un autre centre est une opération explicite
(`transfererVers`). Le rattachement est distinct du centre gestionnaire d'une
collecte (RDC-COLLECTE-004). Un centre qui a des magasins ne peut pas être
supprimé (v1 : `onDelete: Restrict`).

**Pourquoi.** Le centre de rattachement est le centre gestionnaire par défaut
des nouvelles collectes, et détermine la liste de vérification où le magasin
apparaît (RDC-COLLECTE-014).

**Contrat publié.** `referentiel` fournit à `collecte` la liste des magasins
actifs rattachés à chaque centre actif (TENETS-CONTEXT-006).

**Source v1.** `libs/domain/src/magasin/magasin.entity.ts:360-364` ;
`apps/api/prisma/schema.prisma:35-57`.

## RDC-REF-006 — Désactiver ou archiver un magasin engagé dans une collecte active

`core` · erreur · 🔁 reportée à l'étape 5 · ⚠️ comportement à trancher (D-03)

**Règle.** Le code v1 refuse la désactivation et l'archivage d'un magasin qui
participe à une collecte PREPARATION ou EN_COURS (`MAGASIN_COLLECTES_EN_COURS`).
Le document soumis au client prévoyait au contraire un **retrait automatique**
du magasin en PREPARATION. La règle dépend de `collecte` : elle est reportée à
l'étape 5, comme RDC-REF-004 ; le choix du comportement (D-03) se fait avant
cette étape.

**Vérification en revue.** Une fois tranchée, la règle vit dans le domaine,
pas dans un use case seul.

**Source v1.**
`apps/api/src/application/use-cases/magasin/desactiver-magasin.usecase.ts:29-42` ;
`apps/api/src/application/use-cases/magasin/archiver-magasin.usecase.ts:29-42` ;
`docs/architecture/regles-metier-validation.md:41-58`.

## RDC-REF-007 — Images d'un magasin

`pragmatic` · erreur · ⏳ à implémenter (étape 3)

**Règle.** En v1, un magasin a des images ordonnées ; ajouter un identifiant déjà
présent ou retirer une image absente est une erreur
(`MAGASIN_IMAGE_DEJA_PRESENTE`, `MAGASIN_IMAGE_INTROUVABLE`, traduites en 400).
En v2, le stockage passe par un port et corrige l'audit A-18 : nom UUID,
extension non dérivée du nom client et type vérifié sur le contenu.

**Source v1.** `libs/domain/src/magasin/magasin.entity.ts:324-357`.
**Écart v2.**
`docs/audit/audit-backend-2026-08-01.md:187-188` (A-18) ; le code v1 vulnérable
est `apps/api/src/application/use-cases/magasin/ajouter-image-magasin.usecase.ts:39-45`.

## RDC-REF-008 — Catalogue des produits

`core` · erreur · ✅ implémentée (étape 3, lot B)

**Règle.** Un produit a un code au format `D` suivi de 6 chiffres, une famille
et une sous-famille non vides, et un indicateur actif. On désactive un
produit, on ne le supprime pas. La reconstitution accepte les anciens formats
de code (données historiques importées).

**Pourquoi.** Une ligne de pesée conserve sa propre référence, saisie par le
client et non contrôlée contre le catalogue en v1 (D-11, RDC-SAISIE-005). Le
catalogue peut donc évoluer sans modifier l'historique.

**Source v1.** `libs/domain/src/produit/produit.entity.ts:27-66,91-128` ;
`libs/domain/src/produit/value-objects/code-produit.vo.ts:6-27`.

## RDC-REF-009 — L'enseigne d'un magasin

`pragmatic` · avertissement · ⏳ à implémenter (étape 7) · D-04 décidée

**Règle.** En v1, l'enseigne n'existe pas comme donnée : c'est le **nom du
magasin** normalisé par `UPPER(TRIM(nom))`. Seuls les espaces de début et de fin
et la casse sont ignorés ; les espaces internes comptent. « Leclerc » et
« Leclerc Agen Sud » forment donc deux enseignes. **Décision D-04 : la v2
garde cette convention.** Le magasin n'a pas de champ `enseigne` ; un tel champ
pourra s'ajouter plus tard par une migration qui recopie le nom.

**Source v1.**
`apps/api/src/application/use-cases/stats/restreindre-stats-enseigne.ts:86-88` ;
`apps/api/src/infrastructure/queries/global-stats.prisma.query.ts:2755-2762`.

## RDC-REF-010 — Seul un centre actif reçoit un nouveau rattachement

`core` · erreur · ✅ création et transfert d'un magasin (étape 3) · ⏳ bénévoles et plannings (étape 6)

**Règle.** Créer ou transférer un magasin, créer un bénévole, planifier des
bénévoles au centre ou planifier un chauffeur exige un centre ACTIF. Un centre
INACTIF ou ARCHIVE est refusé avec `CENTRE_NON_ACTIF` (409). Cette règle porte
sur les **nouveaux rattachements** ; l'inscription à une collecte suit la règle
distincte RDC-COLLECTE-004.

**Exception v1.** Le planning magasin peut créer implicitement un bénévole dans
le centre gestionnaire sans vérifier que ce centre est ACTIF. La v2 doit appliquer
`CENTRE_NON_ACTIF` à ce parcours aussi, selon la décision D-05.

**Pourquoi.** Un centre inactif conserve son historique, mais ne reçoit plus de
nouvelle activité opérationnelle.

**Source v1.**
`apps/api/src/application/use-cases/magasin/creer-magasin.usecase.ts:41-45` ;
`apps/api/src/application/use-cases/magasin/modifier-magasin.usecase.ts:58-65` ;
`apps/api/src/application/use-cases/benevole/creer-benevole.usecase.ts:46-53` ;
`apps/api/src/application/use-cases/planning-benevoles-centre/planifier-benevoles-centre.usecase.ts:58-63` ;
`apps/api/src/application/use-cases/planning-chauffeur/planifier-chauffeur.usecase.ts:76-81` ;
`apps/api/src/application/use-cases/planning-magasin/planifier-benevoles-magasin.usecase.ts:122-126,181-192`.

## RDC-REF-011 — Un centre ne s'archive pas tant qu'il a des magasins

`core` · erreur · ⏳ à implémenter (étape 3, décision D-18)

**Règle.** Archiver un centre qui a au moins un magasin ACTIF ou INACTIF est
refusé avec `CENTRE_A_DES_MAGASINS` (409). Les magasins archivés ne comptent
pas. Archiver un centre déjà archivé reste sans effet. Désactiver un centre
reste permis, quels que soient ses magasins.

**Pourquoi.** Un magasin rattaché à un centre archivé n'a plus de centre qui le
gère, et ne peut plus y être rattaché à nouveau (RDC-REF-010).

```ts
// ❌ Incorrect : les magasins restent rattachés à un centre archivé
centre.archiver(maintenant);

// ✅ Correct : le use case vérifie d'abord les magasins rattachés
if (await magasinRepository.existsNonArchiveDuCentre(centre.id)) {
  throw new CentreADesMagasins(centre.id);
}
centre.archiver(maintenant);
```

**Vérification en revue.** Le contrôle se fait dans l'unité de travail, avant
`archiver()` ; l'erreur est traduite en 409.

**Source v1.** Aucune : règle ajoutée par la v2 (D-18).
