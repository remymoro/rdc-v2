@AGENTS.md

## Claude Code

- Les règles détaillées se chargent automatiquement selon le fichier ouvert :
  `.claude/rules` est un lien vers `docs/architecture/regles/` (ADR-0005).
  Vérifier avec `/context` que `00-index.md` apparaît dans les fichiers mémoire.
- Avant de déclarer une fonctionnalité terminée : `pnpm nx affected -t lint test build`
  doit passer, et la revue d'architecture doit citer les règles concernées.
