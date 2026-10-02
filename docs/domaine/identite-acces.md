---
paths:
  - 'libs/identite-acces/**/*'
  - 'libs/*/adapters/src/http/**/*'
  - 'apps/api/**/*'
---

# Règles métier — contexte `identite-acces`

Deux rôles. Les bénévoles ne sont pas des utilisateurs de l'application.
Un `RESPONSABLE_CENTRE` n'est pas une personne : c'est **le compte du centre**,
partagé par l'équipe qui gère le centre (D-19). Les comptes sont gérés par
l'admin seul, pour éviter toute gestion de comptes personnels alors que cette
équipe change souvent.

**Compte de centre et bénévole sont deux notions distinctes.** Un bénévole
(contexte `benevoles`) est une personne affectée sur le terrain : il n'a pas de
compte, ne se connecte jamais, et aucune donnée ne relie une fiche bénévole au
compte d'un centre.

| Rôle                 | Peut                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `ADMIN`              | tout : référentiel, collectes, clôtures, réouvertures, responsables   |
| `RESPONSABLE_CENTRE` | son centre : bénévoles, plannings, pesées, statistiques de son centre |

## RDC-ACCES-001 — Un responsable de centre est rattaché à un centre

`core` · erreur · ⏳ à implémenter (étape 4)

**Règle.** Un utilisateur `RESPONSABLE_CENTRE` a toujours un centre. Un
`ADMIN` n'en a pas besoin. Si l'invariant est violé en base, la reconstitution
refuse de charger l'utilisateur (choix fail-fast de la v1, cohérent avec
ADR-0003 R9).

**Pourquoi.** Sans centre, le périmètre du responsable serait indéfini.

**Source v1.** `libs/domain/src/user/user.entity.ts:37-95`.

## RDC-ACCES-002 — Un responsable ne voit et ne modifie que son centre

`core` · erreur · ⏳ à implémenter (étape 4)

**Règle.**

- Pour un responsable, le centre vient **toujours** du jeton, jamais d'un
  paramètre de requête.
- Un ADMIN peut filtrer sur n'importe quel centre.
- L'accès à un magasin dans une collecte passe par son **centre gestionnaire**
  (RDC-COLLECTE-013), pas par son centre de rattachement.
- Le contrôle de périmètre s'applique toujours, et non seulement quand la
  ressource existe (audit A-11).

**Pourquoi.** Les données des bénévoles sont personnelles : une fuite entre
centres est un incident RGPD.

```ts
// ❌ Incorrect
@Get() lister(@Query('centreId') centreId: string) { ... }
const slot = await repo.get(id); if (slot) verifierPerimetre(user, slot.centreId);

// ✅ Correct : règle applicative testée (ADR-0003 R11)
const centreId = perimetre.centreAutorise(utilisateur, requete.centreId);
```

**Vérification en revue.** Chaque route qui renvoie des données d'un centre a
un test « responsable d'un autre centre → 403 ».

**Source v1.** `apps/api/src/presentation/http/utils/resolve-centre-filter.ts:4-19` ;
routes `apps/api/src/presentation/http/controllers/stats.controller.ts:182-278`.

## RDC-ACCES-003 — Le rôle est vérifié à un seul endroit

`core` · erreur · ⏳ à implémenter (étape 4)

**Règle.** Un seul guard décide du rôle, à partir d'une métadonnée de route.
Aucun contrôleur ne réimplémente `assertAdmin`. Une route sans rôle déclaré
n'est ouverte à tous les utilisateurs connectés que par choix explicite.
Chaque route protégée a un test « refusé » (ADR-0003 R11).

**Pourquoi.** En v1, cinq mécanismes d'autorisation coexistaient ; une route en
a oublié un (audit A-10, A-12).

**Source v1.** `apps/api/src/presentation/http/guards/roles.guard.ts:17-46`.

## RDC-ACCES-004 — Le premier administrateur

`core` · erreur · ⏳ à implémenter (étape 4)

**Règle.** Aucun compte n'existe par défaut. Le premier ADMIN est créé par une
route publique, limitée en débit, refusée dès qu'un ADMIN existe. Les données
d'amorçage ne créent jamais d'administrateur et ne réécrivent jamais le mot de
passe ni l'état d'un compte existant.

**Pourquoi.** En v1, le seed de production réinitialisait le mot de passe des
14 responsables à chaque déploiement (audit A-01, critique).

**Source v1.**
`apps/api/src/application/use-cases/auth/bootstrap-admin.usecase.ts:12-47` ;
`apps/api/prisma/seed.ts:1292-1334`.

## RDC-ACCES-005 — Archiver un centre désactive ses responsables

`pragmatic` · erreur · 🔁 reportée à l'étape 4 (décision du 2026-10-01)

**Comportement v1.** Quand un centre est archivé, ses responsables sont
désactivés dans la même transaction. Leurs sessions ne sont pas révoquées : le
prochain rafraîchissement échoue car l'utilisateur est inactif, mais le jeton
d'accès déjà émis reste valable jusqu'à 15 minutes.

**Règle v2.** À l'étape 4, l'archivage d'un centre déclenche l'événement « centre
archivé ». En réaction, Identité et accès désactive ses responsables **et révoque
leurs sessions** (TENETS-EVENT-002). L'événement est créé avec ce consommateur
(ADR-0003 R13).

Le refus de désactiver le compte d'un centre pendant une collecte est la règle
RDC-ACCES-012.

**Source v1.**
`apps/api/src/application/use-cases/centre/archiver-centre.usecase.ts:42-58` ;
`apps/api/src/application/use-cases/auth/refresh-token.usecase.ts:79-85`.

## RDC-ACCES-006 — Sessions

`core` · erreur · ⏳ à implémenter (étape 4)

**Règle.**

- Jeton d'accès de 15 min, renvoyé en JSON et gardé en mémoire par le front.
- Jeton de rafraîchissement de 7 jours, en cookie `HttpOnly`, `Secure`
  (HTTPS obligatoire, ADR-0019), `SameSite=Strict`, `path=/api/auth`, stocké
  haché en base.
- Rotation à chaque rafraîchissement. Un jeton déjà utilisé et présenté de
  nouveau révoque toute la famille de sessions (audit A-09).
- Désactiver un utilisateur révoque ses sessions. Les sessions expirées sont
  purgées.

**Source v1.**
`apps/api/src/presentation/http/controllers/auth.controller.ts:122-139` ;
`apps/api/src/application/use-cases/auth/refresh-token.usecase.ts:74-90`.

## RDC-ACCES-007 — Mots de passe et limitation de débit

`core` · erreur · ⏳ à implémenter (étape 4)

**Règle.**

- Hachage lent et non bloquant (pas de `pbkdf2Sync`), avec une longueur maximale
  de mot de passe (audit A-06).
- Une connexion avec un email inconnu prend le même temps qu'avec un email
  connu : hachage factice (audit A-07).
- Limite de débit sur connexion, rafraîchissement, premier admin et exports,
  calculée sur l'IP réelle derrière le proxy (audit A-03, A-05).

**Source v1.**
`apps/api/src/infrastructure/security/password-hasher.service.ts:1-52` ;
`docs/audit/audit-backend-2026-08-01.md:172-179`.

## RDC-ACCES-008 — Traçabilité des accès aux données personnelles

`pragmatic` · avertissement · ⏳ connexions à l'étape 4 · ⚠️ durée de conservation et données des bénévoles à trancher (D-06)

**Règle.** Connexions, échecs de connexion, consultations et modifications de
données de bénévoles sont journalisés : quel compte, quoi, quand. Absent en v1
(audit A-04 / B-01). Avec un compte par centre (D-19), la trace désigne le
centre, pas la personne.

**Décision du 2026-10-02.** Les connexions et les échecs de connexion sont
journalisés dès l'étape 4 : une trace non écrite ne se rattrape pas. Durée de
conservation provisoire : 1 an, à confirmer avec D-06. Les consultations et
modifications de données de bénévoles suivent à l'étape 6.

**Pourquoi.** Obligation de responsabilité RGPD (art. 5.2) ; sans trace, on ne
peut pas mesurer l'étendue d'une fuite.

## RDC-ACCES-009 — Seul l'admin définit le mot de passe d'un compte de centre

`pragmatic` · avertissement · ⏳ à implémenter (étape 4) · D-09 et D-19 décidées

**Règle.** L'admin définit le mot de passe du compte d'un centre et le
transmet au centre. Le centre ne le change pas lui-même : aucune route de
libre-service ni de mot de passe oublié. Quand une personne quitte le centre,
l'admin change le mot de passe ; ce changement révoque les sessions en cours
du compte.

**Pourquoi.** Décisions D-09 et D-19 (2026-10-02) : la v2 reste sur le NAS
local, accessible par VPN (ADR-0019), et le compte est partagé par l'équipe
qui gère le centre. À revoir si l'API devient accessible depuis Internet.

## RDC-ACCES-010 — Un centre a au plus un compte actif

`core` · erreur · ⏳ à implémenter (étape 4) · D-19 décidée

**Règle.** Le compte d'un centre (rôle `RESPONSABLE_CENTRE`) se connecte avec
une adresse email propre au compte, choisie par l'admin : celle du centre ou
une adresse créée pour la collecte. Cette adresse est unique parmi tous les
comptes. Créer ou réactiver un compte pour un centre qui en a déjà un actif est
refusé (conflit, 409). Un compte désactivé ne compte pas. Un centre peut
n'avoir aucun compte.

**Pourquoi.** Décision D-19 : un seul compte par centre, partagé, sans gestion
de comptes personnels.

**Le compte garde sa propre adresse.** Elle est préremplie avec l'email du
centre, mais modifier l'email de contact du centre (`referentiel`) ne change
pas l'identifiant de connexion (TENETS-CONTEXT-002 : on échange des
identifiants, pas des agrégats).

**Vérification en revue.** La règle est vérifiée dans l'unité de travail, et
une contrainte en base sert de filet pour deux créations simultanées
(comme RDC-REF-001).

**Source v1.** La v1 ne limite pas le nombre de responsables
(`apps/api/src/application/use-cases/auth/creer-responsable.usecase.ts:25-70`),
mais ses comptes utilisent déjà l'adresse du centre. Écart : ADR-0020.

## RDC-ACCES-011 — Un seul administrateur

`core` · erreur · ⏳ à implémenter (étape 4) · D-19 décidée

**Règle.** Il existe au plus un ADMIN. Il est créé par la route de premier
administrateur (RDC-ACCES-004), qui est ensuite refusée. Aucune route ne crée
un autre ADMIN ni ne transforme un responsable en ADMIN.

**Pourquoi.** Décision du client (D-19) : le siège de l'AD47 a un seul
administrateur de RDC.

**Vérification en revue.** Aucun chemin (route, amorçage, script) ne crée un
second ADMIN.

**Source v1.** Même comportement de fait : seul `bootstrap-admin` crée un ADMIN
(`apps/api/src/application/use-cases/auth/bootstrap-admin.usecase.ts:12-47`).

## RDC-ACCES-012 — Le compte d'un centre ne se désactive pas pendant une collecte

`core` · erreur · 🔁 reportée à l'étape 5 (décision du 2026-10-02)

**Règle.** Désactiver le compte d'un centre est refusé dès que ce centre est
affecté à une collecte non terminée (PREPARATION ou EN_COURS), et jusqu'à ce
qu'elle passe TERMINEE. Un centre est affecté à une collecte quand il est
centre gestionnaire d'au moins un magasin inscrit, ou quand il a une liste de
vérification pour cette collecte (RDC-COLLECTE-014). Changer le mot de passe
reste permis : c'est ce que fait l'admin quand une personne quitte le centre.
La réponse vient du contrat publié par `collecte` (RDC-COLLECTE-013,
TENETS-CONTEXT-006), comme RDC-REF-004.

**Pourquoi.** Dès son affectation, le centre doit pouvoir remplir sa liste de
vérification, planifier et peser : sans compte actif, il serait bloqué.

**Vérification en revue.** Le contrôle passe par le contrat publié de
`collecte`, jamais par une lecture directe de ses tables.

**Source v1.** Règle déjà annoncée en v1 (« désactiver un responsable dont le
centre participe à une collecte active »), reportée par la décision du
2026-10-01.
