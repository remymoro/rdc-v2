---
paths:
  - 'libs/identite-acces/**/*'
  - 'libs/*/adapters/src/http/**/*'
  - 'apps/api/**/*'
---

# Règles métier — contexte `identite-acces`

Deux rôles. Les bénévoles ne sont pas des utilisateurs de l'application.

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

Le refus de désactiver un responsable dont le centre participe à une collecte
active est reporté à l'étape 5, car il dépend du contrat publié par collecte.

**Source v1.**
`apps/api/src/application/use-cases/centre/archiver-centre.usecase.ts:42-58` ;
`apps/api/src/application/use-cases/auth/refresh-token.usecase.ts:79-85`.

## RDC-ACCES-006 — Sessions

`core` · erreur · ⏳ à implémenter (étape 4)

**Règle.**

- Jeton d'accès de 15 min, renvoyé en JSON et gardé en mémoire par le front.
- Jeton de rafraîchissement de 7 jours, en cookie HttpOnly (`SameSite=Strict`,
  `path=/api/auth`), stocké haché en base.
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

`pragmatic` · avertissement · ⚠️ à trancher (D-06)

**Règle.** Connexions, échecs de connexion, consultations et modifications de
données de bénévoles sont journalisés : qui, quoi, quand. Absent en v1 (audit
A-04 / B-01). Forme et durée de conservation à décider.

**Pourquoi.** Obligation de responsabilité RGPD (art. 5.2) ; sans trace, on ne
peut pas mesurer l'étendue d'une fuite.

## RDC-ACCES-009 — Changement de mot de passe en libre-service

`pragmatic` · avertissement · ⚠️ à trancher (D-09)

**Règle.** La v1 ne permet pas à un responsable de changer lui-même son mot de
passe ; seul l'admin peut le faire. La nécessité d'un libre-service dépend du
mode d'exposition de la v2 et doit être décidée avant l'étape 4.

**Source v1.** Fonctionnalité absente, décision du 2026-08-24 documentée dans
`CLAUDE.md:867-871` de la v1 (audit A-02).
