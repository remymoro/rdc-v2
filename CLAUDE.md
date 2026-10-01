@AGENTS.md

## Claude Code

- Les règles détaillées se chargent automatiquement selon le fichier ouvert :
  `.claude/rules` est un lien vers `docs/architecture/regles/` (ADR-0005).
  Vérifier avec `/context` que `00-index.md`, `domaine/00-index.md` et
  `domaine/glossaire.md` apparaissent dans les fichiers mémoire (ADR-0011).
- Avant de déclarer une fonctionnalité terminée : `pnpm nx affected -t lint test build`
  doit passer, et la revue d'architecture doit citer les règles concernées.
