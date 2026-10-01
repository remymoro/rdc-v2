# Revue — connaissance métier (ADR-0011) et Agent Gate (ADR-0012)

- **Date :** 2026-10-01
- **Branche relue :** `docs/domaine-connaissance-metier` (travail non commité)
- **Relecteurs :** Claude Code (agent principal + 2 sous-agents en lecture seule,
  comparaison avec le code v1 de `../rdc`)
- **Statut :** `corrections_documentaires_appliquees` — Agent Gate restant

## Mise à jour du 2026-10-01 — rangement fait par Claude Code

Le travail est maintenant commité sur **deux branches locales, non poussées**,
empilées sur `main` à jour (étape 2 fusionnée, PR #3) :

```text
main (bd5af4e)
└── docs/domaine-connaissance-metier  1b2a879  ADR-0011, docs/domaine/, lien, AGENTS.md § Métier, CLAUDE.md, 13-nommage.md
    └── chore/agent-gate              c27170f  ADR-0012, tools/agent-gate/, package.json, ci.yml, README, roadmap « Outillage transverse »
```

- **A1, A2, A4 : faits.** Étape 2 fusionnée, branches séparées,
  `docs/roadmap.md.orig` supprimé. `package.json` : `verify` garde `typecheck`
  (venu de `main`) **et** les tests de l'Agent Gate.
- **`chore/agent-gate` dépend de la doc métier** (le gate exige
  `docs/domaine/00-index.md` et `glossaire.md`) : fusionner
  `docs/domaine-connaissance-metier` d'abord, puis rebaser `chore/agent-gate`
  sur `main`.
- **Où corriger :** sections B, C, D et le reste de E → commits sur
  `docs/domaine-connaissance-metier` ; A3, A5 → même branche ; points E
  « Agent Gate » (regex de branche, accents) → `chore/agent-gate`. Après une
  correction de la doc métier : `git switch chore/agent-gate && git rebase
docs/domaine-connaissance-metier`.
- RDC-REF-002 (`archiver()`, `CentreArchive`) décrit désormais du code présent
  sur `main` : ne pas le repasser en ⏳. La roadmap de `main` contient la section
  « Étape 2 » complète (use cases, HTTP, E2E, ADR-0013, règles reportées).
- Un commit par sujet, pas de push sans accord de l'utilisateur.

## Consignes pour l'agent qui corrige

1. Corrige les constats dans l'ordre : **A** (organisation), **B** (règles
   manquantes), **C** (règles fausses), **D** (nouvelles questions), **E** (mineur).
2. Pour chaque règle ajoutée ou corrigée : vérifie toi-même la source v1 avant
   d'écrire ; cite-la avec le **chemin complet depuis la racine de `../rdc`** et la
   ligne (`apps/api/src/application/use-cases/…:41-45`).
3. Ne renumérote jamais un identifiant `RDC-…` existant ; une nouvelle règle prend
   le numéro suivant libre du contexte.
4. Ne touche pas au code (`libs/`, `apps/`) : cette revue ne porte que sur la
   documentation et `tools/agent-gate/`.
5. Termine par la liste de contrôle en fin de document, puis `pnpm agent:gate`.

Abréviations de chemins v1 utilisées ci-dessous :

- `UC/` = `apps/api/src/application/use-cases/`
- `DOM/` = `libs/domain/src/`
- `HTTP/` = `apps/api/src/presentation/http/`
- `Q/` = `apps/api/src/infrastructure/queries/`

---

## A. Organisation (à faire en premier)

**A1 — La doc dépend de l'étape 2, non fusionnée.** `referentiel.md` (RDC-REF-002,
lignes ~35 et ~50) décrit `archiver()` / `CentreArchive` comme implémentés. C'est
vrai sur `feat/referentiel-cycle-de-vie-centre`, pas sur `main` (base de cette
branche). Les deux branches modifient aussi `docs/roadmap.md`.
→ L'utilisateur fusionne d'abord l'étape 2 ; ensuite rebaser cette branche sur
`main` et résoudre `docs/roadmap.md` (garder la section « Étape 2 » de la branche
feat **et** la section « Outillage transverse »). Ne pas modifier les états en
attendant.

**A2 — Deux sujets sur une branche.** Séparer en deux branches / deux PR :
`docs/domaine-connaissance-metier` (ADR-0011, `docs/domaine/`, lien symbolique,
`AGENTS.md` § Métier, `CLAUDE.md`, `13-nommage.md`) et `chore/agent-gate`
(ADR-0012, `tools/agent-gate/`, `package.json`, `ci.yml`, `README.md`, ligne
roadmap « Outillage transverse », commandes `agent:gate` d'`AGENTS.md`).

**A3 — Statut d'ADR-0011.** « proposé » alors qu'`AGENTS.md` et `CLAUDE.md`
l'appliquent déjà → passer à « accepté » (ou retirer les renvois tant qu'il est
proposé).

**A4 — `docs/roadmap.md.orig`.** Fichier parasite non suivi : le supprimer (le
gate le signale à juste titre). Vérifier qu'aucun contenu utile n'y manque dans
`docs/roadmap.md`.

**A5 — Exceptions à documenter dans ADR-0011 §3 :**

- `identite-acces.md` charge aussi `libs/*/adapters/src/http/**/*` et
  `apps/api/**/*` (défendable : le périmètre « mon centre » concerne tout le HTTP) ;
- `a-trancher.md` a `paths: docs/domaine/**` : il n'est jamais chargé quand on code
  dans `libs/` (acceptable car chaque règle ⚠️ résume sa question).

---

## B. Règles v1 manquantes

**B1 — Une seule collecte par année** (`collecte.md`, nouvelle règle, ex.
RDC-COLLECTE-014). Erreur `COLLECTE_ANNEE_DEJA_EXISTANTE` ; année = celle de
`dateDebut`. Vérifiée à la création et à la modification. La comparaison N/N-1 en
dépend. Piège v1 : le repository compare l'année en UTC, le use case utilise
`getFullYear()` (heure locale) → fixer le fuseau (Europe/Paris ?) ou l'ajouter à
`a-trancher.md`.
Sources : `UC/collecte/creer-collecte.usecase.ts:24-33`,
`UC/collecte/modifier-collecte.usecase.ts:36-43`,
`apps/api/src/infrastructure/repositories/collecte.prisma.repository.ts:145-157`.

**B2 — Seul un centre actif reçoit un nouveau rattachement** (`referentiel.md`,
nouvelle règle ex. RDC-REF-010, étape 3 ; à citer dans `benevoles.md`
RDC-BENEVOLE-002 et dans `planification.md`). `CENTRE_NON_ACTIF` (409) refuse un
centre INACTIF **ou** ARCHIVE pour : créer un magasin, transférer un magasin, créer
un bénévole, planifier des bénévoles centre, planifier un chauffeur. C'est ce qui
donne son sens métier à « Inactif » → préciser aussi la définition dans le
glossaire.
Sources : `UC/magasin/creer-magasin.usecase.ts:41-46`,
`UC/magasin/modifier-magasin.usecase.ts:58-63`,
`UC/benevole/creer-benevole.usecase.ts:48-53`,
`UC/planning-benevoles-centre/planifier-benevoles-centre.usecase.ts:58-63`,
`UC/planning-chauffeur/planifier-chauffeur.usecase.ts:76-81`.

**B3 — Conditions d'inscription et de réassignation** (`collecte.md`,
RDC-COLLECTE-004 ou règle dédiée).

- Inscription : magasin actif obligatoire (`MAGASIN_INACTIF`) ; centre de
  rattachement **non archivé** (`CENTRE_ARCHIVE`, 400) — un centre **inactif** est
  accepté (différence voulue avec B2, à écrire explicitement).
- Réassignation : centre cible non archivé (`CENTRE_ARCHIVE`) ; réassigner vers le
  même centre est sans effet.
  Sources : `UC/collecte/ajouter-magasin-collecte.usecase.ts:50-71`,
  `UC/collecte/reassigner-magasin-collecte.usecase.ts:50-55`,
  `DOM/collecte/aggregates/collecte.aggregate.ts:414-416`.

**B4 — Retrait d'un magasin ayant des créneaux** (`collecte.md` + renvoi dans
`planification.md`). Refus `MAGASIN_A_DES_SLOTS_ACTIFS` (409) si des créneaux
PLANIFIE existent, sauf `force=true` qui les annule. Opération inter-contextes :
noter qu'en v2 elle passera par un contrat publié ou un événement
(TENETS-CONTEXT-006 / EVENT-002).
Source : `UC/collecte/retirer-magasin-collecte.usecase.ts:41-60`.

**B5 — Conditions de la saisie par centre** (`collecte.md` RDC-COLLECTE-009, 010,
011).

- Le centre doit gérer au moins un magasin de la collecte
  (`CENTRE_NON_PARTICIPANT`).
- Collecte EN_COURS exigée : `COLLECTE_STATUT_INVALIDE_POUR_CONFIRMATION` (403)
  pour déclarer terminé / forcer, `COLLECTE_STATUT_INVALIDE_POUR_REOUVERTURE` pour
  rouvrir.
- La ligne de saisie d'un centre n'existe qu'au premier acte : sans ligne, l'état
  vaut EN_COURS.
  Sources : `UC/collecte/marquer-saisie-centre-terminee.usecase.ts:47-78`,
  `UC/collecte/forcer-validation-saisie-centre.usecase.ts:49-80`,
  `UC/collecte/reouvrir-saisie-centre.usecase.ts:46-62`,
  `Q/collecte-centre-saisie.prisma.query.ts:24-40`.

**B6 — Clôture : compléter RDC-COLLECTE-005.** Code
`COLLECTE_SAISIES_CENTRES_INCOMPLETES` (levé par attente, approbation, terminer) ;
« tous les centres » = centres gestionnaires des participations, un centre sans
ligne de saisie compte comme non terminé ; `marquerEnAttenteCloture` est
idempotent.
Sources : `UC/collecte/approuver-cloture-collecte.usecase.ts:40-49`,
`UC/collecte/terminer-collecte.usecase.ts:40-49`,
`DOM/collecte/aggregates/collecte.aggregate.ts:333-335`,
`Q/collecte-centre-saisie.prisma.query.ts:63-70`.

**B7 — Le planning magasin crée aussi des bénévoles** (`planification.md`
RDC-PLANIF-006, `a-trancher.md` D-05, `benevoles.md` ~71). Pas seulement le
chauffeur : rapprochement par email, puis téléphone, puis homonyme unique
(`BenevoleIdentity.memeNomPrenom`), sinon création dans le **centre gestionnaire**.
Étendre D-05 en conséquence.
Sources : `UC/planning-magasin/planifier-benevoles-magasin.usecase.ts:117-122,145-178`,
`UC/planning-chauffeur/planifier-chauffeur.usecase.ts`.

**B8 — Planning centre : bénévole rattaché au centre** (`planification.md`).
`BENEVOLE_CENTRE_INCOMPATIBLE` ; cette contrainte ne dépend pas de D-05 et ne doit
donc pas être ⚠️.
Source : `UC/planning-benevoles-centre/planifier-benevoles-centre.usecase.ts:94-99`.

**B9 — Chevauchement de créneaux** (`planification.md` ~61-69). Intervalles
stricts : deux créneaux bout à bout sont permis. Citer les codes `*_DEJA_PLANIFIE`
/ `*_DEJA_PLANIFIE_AILLEURS`.
Sources : `DOM/shared/value-objects/creneau-horaire.vo.ts:54-58`,
`DOM/planning/benevoles-centre/aggregates/planning-benevoles-centre.aggregate.ts:104-134`.

---

## C. Règles fausses ou déformées

**C1 — `identite-acces.md` RDC-ACCES-006 : `SameSite=Strict`, pas `Lax`.** La v1 a
changé après un correctif de sécurité (commit `a87ba8a`) ; son `CLAUDE.md:351` est
périmé. Citer `HTTP/controllers/auth.controller.ts:122-140`.

**C2 — `identite-acces.md` RDC-ACCES-005 (~93-97).**

- « Sessions révoquées dans la même transaction » est faux : l'archivage v1
  désactive les responsables **sans** `revokeAllForUser` ; le prochain
  rafraîchissement échoue seulement parce que l'utilisateur est inactif
  (`UC/centre/archiver-centre.usecase.ts:48-57`,
  `UC/auth/refresh-token.usecase.ts:80-84`). → Écrire le comportement v1 ; la
  révocation explicite devient une amélioration v2 (le jeton d'accès reste valable
  900 s en v1).
- La sous-règle « désactiver un responsable est refusé si son centre a une collecte
  active » dépend de Collecte → la marquer 🔁 étape 5, comme RDC-REF-004.

**C3 — `collecte.md` RDC-COLLECTE-010 (~278-282) : la raison de réouverture.**
Le domaine exige ≥ 3 caractères, mais l'API la rend facultative (`@IsOptional`) et
le use case met « Réouverture par l'administrateur » par défaut. → Écrire le
comportement réel, et marquer ⚠️ (raison réellement obligatoire en v2 ?).
Sources : `DOM/collecte/saisie-centre.entity.ts:153-159`,
`UC/collecte/reouvrir-saisie-centre.usecase.ts:79`,
`HTTP/dtos/requests/reouvrir-saisie-centre.request.ts`.

**C4 — `collecte.md` RDC-COLLECTE-007 (~199-206) : fenêtre de saisie.** La règle
**appliquée** en v1 : collecte EN_COURS **et** maintenant ≤ fin effective de
`dateFin`. Le début de fenêtre n'est jamais lu. Piège :
`FenetreSaisieCollecte.saisieEstOuverte` (≥ `dateDebutSaisie`), jamais appelée,
n'autoriserait la pesée que le dernier jour. → Énoncer la règle effective et
signaler le piège.
Sources : `DOM/collecte/aggregates/collecte.aggregate.ts:448-451`,
`DOM/services/saisie-collecte.service.ts:23-27`,
`DOM/collecte/value-objects/fenetre-saisie-collecte.vo.ts:216-218`.

**C5 — `saisie.md` RDC-SAISIE-001 (~148) : pas de modification de pesée en v1.**
Seulement création et validation (routes GET / POST / valider). Remplacer
« créer ou modifier » par « créer ou valider ».
Sources : `HTTP/controllers/saisie.controller.ts:39,51,68`,
`UC/saisie/valider-saisie-entry.usecase.ts:193-204`.

**C6 — `a-trancher.md` D-01 et `00-index.md` (~86-89).** « Diffère de la feuille
de route : collecte vient avant bénévoles » est faux : la roadmap place déjà
Collecte à l'étape 5 et bénévoles à l'étape 6. La seule question réelle est l'ordre
**à l'intérieur de l'étape 6** (bénévoles → planification → saisie). Reformuler,
fixer « Bloque l'étape » à 6, ou retirer D-01.

**C7 — `referentiel.md` RDC-REF-001 (~18-29).** « ✅ implémentée » alors que la
traduction de la violation d'unicité (P2002) reste à faire, et la v1 contrôle aussi
les doublons à la **modification** (`UC/centre/modifier-centre.usecase.ts:48`).
→ « ✅ création · ⏳ filet P2002, modification ».

**C8 — Enseigne (`referentiel.md` ~157-158, `glossaire.md` ~23, `a-trancher.md`
D-04 ~111-113).** La normalisation v1 est `UPPER(TRIM(nom))` : espaces de début et
de fin retirés, casse ignorée ; **les espaces internes comptent**. D-04 : un magasin
**peut** s'appeler « Leclerc Agen Sud », il forme alors une enseigne distincte.
Sources : `UC/stats/restreindre-stats-enseigne.ts:86-88`,
`Q/global-stats.prisma.query.ts:2761`.

**C9 — `saisie.md` RDC-SAISIE-003 (~206-216).** « Sans identifiant d'article en
double » est une garde technique (UUID serveur) ; en v1 le même produit peut
apparaître deux fois dans une pesée — l'écrire. Le numéro de passage est calculé
hors transaction sans contrainte unique : l'unicité est une amélioration v2, à
présenter comme telle.
Source : `UC/saisie/creer-saisie-entry.usecase.ts:91-108`.

**C10 — `statistiques.md` (~342-344).** « 2 954 lignes » : le fichier en compte
3 047 ; « une seule requête porte toutes les statistiques » est faux, la
comparaison annuelle a sa propre requête (847 lignes). Corriger ou retirer les
chiffres.

---

## D. Nouvelles questions à ajouter dans `a-trancher.md`

**D-10 — Centre crédité des poids dans les statistiques.** La v1 est incohérente :
la synthèse utilise le **centre gestionnaire** (`pm."centreId"`), la comparaison
annuelle et certaines séries journalières le **centre de rattachement**
(`m."centreId"`). RDC-SAISIE-006 dit qu'une pesée appartient au centre
gestionnaire. → Ajouter RDC-STATS-006 ⚠️ et la question.
Sources : `Q/comparaison-annuelle.prisma.query.ts:191-204`,
`Q/global-stats.prisma.query.ts:510-572` vs `:667-683,2663`.

**D-11 — Référence produit d'une pesée.** En v1, référence, famille et sous-famille
viennent du client sans contrôle catalogue ; `ReferenceProduit` est libre (≤ 50
caractères), distincte de `CodeProduit`. L'exemple `reference: produit.code` de
RDC-SAISIE-005 (~243-258) suppose l'inverse. → Passer RDC-SAISIE-005 en ⚠️ :
référence libre ou catalogue obligatoire ?
Sources : `UC/saisie/creer-saisie-entry.usecase.ts:107-113`,
`DOM/produit/value-objects/reference-produit.vo.ts:5-14`.

**D-12 (optionnel) — Fuseau de l'année d'une collecte** (voir B1), si non tranché
dans la règle.

---

## E. Mineur

- **Sources v1** : aucune n'a de numéro de ligne et les chemins sont abrégés
  (`centre/centre.entity.ts` → `libs/domain/src/centre/centre.entity.ts`,
  `prisma/schema.prisma` → `apps/api/prisma/schema.prisma`, etc.). Tous les fichiers
  cités existent : compléter chemins et lignes.
- **Sources manquantes** : RDC-PLANIF-005 (ajouter les agrégats de planning) ;
  RDC-STATS-004 → « absent en v1 (audit A-17) » ; RDC-REF-007 → séparer « v1 »
  (images ordonnées, `MAGASIN_IMAGE_*` en 400) et « écart v2 (audit A-18) ».
- **Glossaire** : ajouter les verbes **Activer / Désactiver / Archiver** (méthodes
  de `Centre`), **Clé de doublon** (`CleDoublonCentre`), **Transférer**
  (`transfererVers`). Choisir entre « réactiver » et `activer()` (le code dit
  `activer`, la roadmap et les commits disent « réactiver ») et mettre l'autre en
  synonyme à éviter. Aligner la section et le contexte d'« Enseigne ». Ajouter le
  démarrage manuel d'une collecte par l'admin (`PATCH /collectes/:id/demarrer`,
  `HTTP/controllers/collecte.controller.ts:151-152`).
- **`a-trancher.md` D-02 ↔ RDC-COLLECTE-002** : 002 est ⏳ mais sa condition « au
  moins une participation » dépend de D-02 → marquer 002 ⚠️ ou retirer le lien.
- **D-09** rattachée à RDC-ACCES-007 qui n'en parle pas → ajouter RDC-ACCES-009 ⚠️
  ou une puce ⚠️ dans 007.
- **`benevoles.md` (~180, ~194)** : préciser « ⏳ (étape 6) ».
- **`saisie.md` RDC-SAISIE-002** : citer `POIDS_KG_INVALIDE`.
- **`statistiques.md`** : documenter les axes temporels (année = `YEAR(dateDebut)` ;
  jour d'une pesée = `createdAt` en Europe/Paris).
- **Agent Gate** :
  - la regex de branche accepte `refactor/` et `test/`, absents d'ADR-0010 →
    aligner l'un sur l'autre (et le documenter) ;
  - messages sans accents (« depot », « protegee », « integration ») alors que le
    projet écrit en français accentué → accentuer (sortie UTF-8).

---

## Vérifié et exact (ne pas retoucher)

- Cohérence avec les décisions de l'utilisateur du 2026-10-01 : RDC-REF-004 🔁
  étape 5 (collectes actives), RDC-ACCES-005 🔁 étape 4 via événement.
- RDC-REF-002 (cycle de vie centre/magasin), RDC-REF-003 (ADR-0006/0007),
  RDC-REF-005, 006, 008 ; RDC-ACCES-001, 002, 004, 006 hors SameSite, 007 ;
  RDC-BENEVOLE-001..003.
- RDC-COLLECTE-001..004, 006, 008, 009 (hors B5), 011, 012 ; RDC-PLANIF-001..004 ;
  RDC-SAISIE-001 (création), 002, 003, 004, 006 ; RDC-STATS-001, 003, 005.
- 52 identifiants sans doublon, références croisées définies, en-têtes `paths:`
  valides, lien `docs/architecture/regles/domaine` présent.
- Agent Gate : 7 tests verts, arguments `-- --full` / `--policy-only` transmis.

## Liste de contrôle finale

- [x] A1 à A5 traités
- [x] B1 à B9 ajoutés, chacun avec source `chemin:ligne` vérifiée
- [x] C1 à C10 corrigés
- [x] D-10, D-11, D-12 et D-13 ajoutés dans `a-trancher.md` et liés à leurs règles ⚠️
- [ ] Points E traités — documentation faite, Agent Gate restant
- [x] Aucun identifiant `RDC-…` renuméroté ; nouveaux numéros uniques
- [ ] `pnpm nx format:write` puis `pnpm agent:gate` vert
- [ ] Un commit par sujet (doc métier, puis Agent Gate) sur deux branches
