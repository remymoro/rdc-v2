# ADR-0005 — Règles Tenets adaptées à NestJS, livrées aux agents par chemin

- **Statut :** accepté
- **Date :** 2026-09-30

## Contexte

Tenets fournit un catalogue de règles DDD/hexagonal avec des identifiants
stables, mais ses exemples sont en Python (Flask, SQLAlchemy). Installer Tenets
tel quel donnerait aux agents des exemples dans le mauvais langage et des
patterns Flask inapplicables. Les agents IA doivent recevoir les bonnes règles
au bon moment, sans charger tout le catalogue à chaque session.

## Décision

- Les règles Tenets du profil **`pragmatic`** (niveaux `core` et `pragmatic`)
  sont réécrites **en français**, avec des exemples **TypeScript/NestJS/Prisma**
  tirés du domaine RDC, dans `docs/architecture/regles/`.
- Les identifiants `TENETS-XXX-NNN` sont conservés tels quels, pour la
  traçabilité avec Tenets. Les règles et patterns propres à Python sont
  réécrits (création par `creer()` / `reconstituer()`, Unit of Work Prisma,
  portée par requête NestJS, tests de contrat Jest).
- Les règles `strict` (ADR-001..003, AGGREGATE-008, EVENT-004..009, ASYNC-\*,
  PATTERN-007..010) ne sont pas reprises. Elles le seront par un nouvel ADR au
  premier besoin (outbox, messagerie asynchrone).
- **Livraison aux agents :**
  - `docs/architecture/regles/00-index.md` n'a pas d'en-tête `paths` : il est
    chargé à chaque session (carte des règles et réflexes essentiels) ;
  - chaque autre fichier déclare un en-tête `paths:` et ne se charge que quand
    l'agent travaille sur les fichiers concernés ;
  - `.claude/rules` est un lien symbolique vers `docs/architecture/regles` :
    un seul texte, aucun doublon à synchroniser ;
  - `AGENTS.md` renvoie les autres agents (Cursor, Copilot, Codex) vers le même
    dossier.

## Conséquences

- Modifier une règle = modifier son fichier dans `docs/architecture/regles/` ;
  ne jamais renuméroter ni réutiliser un identifiant.
- Quand Tenets publie une nouvelle version, comparer son `CHANGELOG` et
  reporter les changements de sens dans ces fichiers.
- Le lien symbolique suppose Linux, macOS ou WSL. Sous Windows natif, activer
  `core.symlinks` dans Git (sinon le lien devient un simple fichier texte).
- Une revue d'architecture cite toujours l'identifiant de la règle concernée.
