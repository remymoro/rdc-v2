# ADR-0011 — Connaissance métier : glossaire, contextes et règles `RDC-XXX-NNN`

- **Statut :** proposé
- **Date :** 2026-10-01

## Contexte

Les règles d'architecture (ADR-0005) disent aux agents **comment** construire,
pas **ce que fait** RDC. Le métier n'existait que dans le code de la v1, dans
son `CLAUDE.md` de 47 ko et dans un document de règles destiné au client, qui
contredit le code sur plusieurs points. Pour la collecte, la planification et la saisie, un agent qui
ne connaît pas les règles en invente.

`13-nommage.md` renvoyait déjà vers un `docs/domaine/glossaire.md` « une fois
écrit », et la feuille de route vers une carte des contextes « à confirmer ».

## Décision

1. **`docs/domaine/`** contient la connaissance métier :
   - `00-index.md` : mode d'emploi, carte des contextes, 10 invariants essentiels ;
   - `glossaire.md` : langage métier, par contexte, avec les synonymes à éviter ;
   - un fichier par contexte (`referentiel.md`, `collecte.md`…) : règles métier
     au format des règles Tenets, avec un identifiant stable `RDC-<CTX>-NNN`,
     un état v2 (✅ ⏳ 🔁 ⚠️) et la source dans la v1 ;
   - `a-trancher.md` : contradictions v1 à faire décider (D-01 à D-09).
2. **Identifiants** : jamais renumérotés ni réutilisés, comme `TENETS-XXX-NNN`.
   Une revue cite la règle métier `RDC-…` à côté de la règle d'architecture.
3. **Livraison aux agents** : même mécanisme que l'ADR-0005. Le lien
   `docs/architecture/regles/domaine → ../../domaine` rend ces fichiers visibles
   dans `.claude/rules/domaine/`, sans copie.
   - `00-index.md` et `glossaire.md`, sans en-tête `paths`, sont chargés à
     chaque session (environ 5 000 tokens) : le langage métier sert aussi aux
     spécifications et aux revues.
   - Les fichiers de contexte se chargent quand on modifie `libs/<contexte>/**`.
4. **Une règle ⚠️ à trancher** n'est pas implémentée avant sa décision.

## Conséquences

- Une décision métier se trace dans `a-trancher.md`, puis dans la règle ; si
  elle s'écarte de la v1, dans un ADR (comme ADR-0006 et ADR-0007).
- À chaque fonctionnalité terminée (étape 7 de la démarche), mettre à jour
  l'état v2 des règles concernées et le glossaire.
- À vérifier avec `/context` dans Claude Code : `domaine/00-index.md` et
  `domaine/glossaire.md` doivent apparaître parmi les fichiers mémoire.
  Comme pour l'ADR-0005, le lien symbolique suppose Linux, macOS ou WSL.
