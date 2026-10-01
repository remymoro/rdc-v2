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

**Source v1.** `user/user.entity.ts`.

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

**Source v1.** `presentation/http/utils/resolve-centre-filter.ts`, routes `stats/mon-centre/**`.

## RDC-ACCES-003 — Le rôle est vérifié à un seul endroit

`core` · erreur · ⏳ à implémenter (étape 4)

**Règle.** Un seul guard décide du rôle, à partir d'une métadonnée de route.
Aucun contrôleur ne réimplémente `assertAdmin`. Une route sans rôle déclaré
n'est ouverte à tous les utilisateurs connectés que par choix explicite.
Chaque route protégée a un test « refusé » (ADR-0003 R11).

**Pourquoi.** En v1, cinq mécanismes d'autorisation coexistaient ; une route en
a oublié un (audit A-10, A-12).

**Source v1.** `guards/roles.guard.ts`.

## RDC-ACCES-004 — Le premier administrateur

`core` · erreur · ⏳ à implémenter (étape 4)

**Règle.** Aucun compte n'existe par défaut. Le premier ADMIN est créé par une
route publique, limitée en débit, refusée dès qu'un ADMIN existe. Les données
d'amorçage ne créent jamais d'administrateur et ne réécrivent jamais le mot de
passe ni l'état d'un compte existant.

**Pourquoi.** En v1, le seed de production réinitialisait le mot de passe des
14 responsables à chaque déploiement (audit A-01, critique).

**Source v1.** `use-cases/auth/bootstrap-admin.usecase.ts`, `prisma/seed.ts`.

## RDC-ACCES-005 — Archiver un centre désactive ses responsables

`pragmatic` · erreur · 🔁 reportée à l'étape 4 (décision du 2026-10-01)

**Règle.** Quand un centre est archivé, ses responsables sont désactivés et
leurs sessions révoquées. En v1 : dans la même transaction. En v2 : réaction à
un événement « centre archivé » (TENETS-EVENT-002), créé seulement quand ce
consommateur existe (ADR-0003 R13). Désactiver un responsable est refusé si son
centre a une collecte active.

**Source v1.** `use-cases/centre/archiver-centre.usecase.ts`, `use-cases/auth/supprimer-responsable.usecase.ts`.

## RDC-ACCES-006 — Sessions

`core` · erreur · ⏳ à implémenter (étape 4)

**Règle.**

- Jeton d'accès de 15 min, renvoyé en JSON et gardé en mémoire par le front.
- Jeton de rafraîchissement de 7 jours, en cookie HttpOnly (`SameSite=Lax`,
  `path=/api/auth`), stocké haché en base.
- Rotation à chaque rafraîchissement. Un jeton déjà utilisé et présenté de
  nouveau révoque toute la famille de sessions (audit A-09).
- Désactiver un utilisateur révoque ses sessions. Les sessions expirées sont
  purgées.

**Source v1.** `use-cases/auth/refresh-token.usecase.ts`, `CLAUDE.md` v1 « Auth JWT ».

## RDC-ACCES-007 — Mots de passe et limitation de débit

`core` · erreur · ⏳ à implémenter (étape 4)

**Règle.**

- Hachage lent et non bloquant (pas de `pbkdf2Sync`), avec une longueur maximale
  de mot de passe (audit A-06).
- Une connexion avec un email inconnu prend le même temps qu'avec un email
  connu : hachage factice (audit A-07).
- Limite de débit sur connexion, rafraîchissement, premier admin et exports,
  calculée sur l'IP réelle derrière le proxy (audit A-03, A-05).

**Source v1.** `infrastructure/security/password-hasher.service.ts`, `docs/audit/audit-backend-2026-08-01.md`.

## RDC-ACCES-008 — Traçabilité des accès aux données personnelles

`pragmatic` · avertissement · ⚠️ à trancher (D-06)

**Règle.** Connexions, échecs de connexion, consultations et modifications de
données de bénévoles sont journalisés : qui, quoi, quand. Absent en v1 (audit
A-04 / B-01). Forme et durée de conservation à décider.

**Pourquoi.** Obligation de responsabilité RGPD (art. 5.2) ; sans trace, on ne
peut pas mesurer l'étendue d'une fuite.
