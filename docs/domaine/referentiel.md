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

`core` · erreur · ✅ implémentée (étape 1)

**Règle.** Deux centres ne partagent pas la même clé de doublon (nom, adresse,
code postal, ville, normalisés comme en v1 : `CleDoublonCentre`). Le use case
vérifie avant d'écrire, dans l'unité de travail ; la contrainte unique en base
sert de filet et doit être traduite en `CentreDejaExistant`
(`CENTRE_ALREADY_EXISTS`, 409). La même règle s'appliquera aux magasins.

**Pourquoi.** Les doublons faussent les statistiques par centre et par magasin.

**Vérification en revue.** Aucune erreur Prisma P2002 ne remonte brute à l'API
(reste à faire, voir `docs/roadmap.md`).

**Source v1.** `prisma/schema.prisma` (`@@unique([nom, ville, codePostal, adresse])`), `findDoublon`.

## RDC-REF-002 — Un élément archivé ne change plus jamais d'état

`core` · erreur · ✅ domaine centre · ⏳ use cases, HTTP, magasin

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

**Source v1.** `centre/centre.entity.ts`, `magasin/magasin.entity.ts`, `docs/architecture/regles-metier-validation.md` §3.

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

**Source v1.** `shared/value-objects/{telephone,email,adresse}.vo.ts`.

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

**Source v1.** `services/centre-lifecycle.service.ts`, `collecte.prisma.repository.ts#findActivesParCentreId`.

## RDC-REF-005 — Un magasin est rattaché à un centre

`core` · erreur · ⏳ à implémenter (étape 3)

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

**Source v1.** `magasin/magasin.entity.ts#transfererVers`, `prisma/schema.prisma#Magasin`.

## RDC-REF-006 — Désactiver ou archiver un magasin engagé dans une collecte active

`core` · erreur · ⚠️ à trancher (D-03)

**Règle.** Le code v1 refuse la désactivation et l'archivage d'un magasin qui
participe à une collecte PREPARATION ou EN_COURS (`MAGASIN_COLLECTES_EN_COURS`).
Le document soumis au client prévoyait au contraire un **retrait automatique**
du magasin en PREPARATION. À trancher avant l'étape 3.

**Vérification en revue.** Une fois tranchée, la règle vit dans le domaine,
pas dans un use case seul.

**Source v1.** `use-cases/magasin/{desactiver,archiver}-magasin.usecase.ts`, `regles-metier-validation.md` §2.

## RDC-REF-007 — Images d'un magasin

`pragmatic` · erreur · ⏳ à implémenter (étape 3)

**Règle.** Un magasin a des images ordonnées. Ajouter une image déjà présente
ou retirer une image absente est une erreur (`MAGASIN_IMAGE_DEJA_PRESENTE`,
`MAGASIN_IMAGE_INTROUVABLE`). Le nom du fichier stocké est généré (UUID) ;
l'extension n'est jamais dérivée du nom envoyé par le client, et le type est
vérifié sur le contenu (audit A-18). Le stockage passe par un port.

**Source v1.** `magasin.entity.ts#ajouterImage/retirerImage`, `local-blob-storage.service.ts`.

## RDC-REF-008 — Catalogue des produits

`core` · erreur · ⏳ à implémenter (étape 3)

**Règle.** Un produit a un code au format `D` suivi de 6 chiffres, une famille
et une sous-famille non vides, et un indicateur actif. On désactive un
produit, on ne le supprime pas. La reconstitution accepte les anciens formats
de code (données historiques importées).

**Pourquoi.** Les pesées copient la référence du produit (RDC-SAISIE-005) ; le
catalogue peut donc évoluer sans fausser l'historique.

**Source v1.** `produit/produit.entity.ts`, `produit/value-objects/code-produit.vo.ts`.

## RDC-REF-009 — L'enseigne d'un magasin

`pragmatic` · avertissement · ⚠️ à trancher (D-04)

**Règle.** En v1, l'enseigne n'existe pas comme donnée : c'est le **nom du
magasin** normalisé (espaces retirés, majuscules). Deux magasins « Leclerc » sont
donc la même enseigne. À décider : attribut `enseigne` explicite sur le magasin,
ou maintien de la convention v1.

**Source v1.** `use-cases/stats/restreindre-stats-enseigne.ts#normaliserEnseigne`.
