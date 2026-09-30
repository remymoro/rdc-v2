# ADR-0010 — Workflow Git : main protégée, pull request et CI obligatoires

- **Statut :** accepté
- **Date :** 2026-09-30

## Contexte

Jusqu'ici, la CI tournait à chaque push de n'importe quelle branche, sans rien
empêcher : `main` n'existait pas sur GitHub, aucune branche n'était protégée, et
deux échecs de CI (audit de sécurité) sont passés inaperçus. Des agents IA
poussent du code : la protection doit être imposée par GitHub, pas par la
discipline.

## Décision

1. **Une branche par fonctionnalité**, nommée `feat/<contexte>-<fonctionnalité>`
   (`fix/…`, `docs/…`, `chore/…` selon la nature), créée depuis `main` à jour.
2. **Un commit par cycle TDD**, au format Conventional Commits
   (`feat(referentiel): …`, `test(…)`, `refactor(…)`, `docs(…)`).
3. **`main` protégée** par un ruleset GitHub, sans exception (liste de
   contournement vide) :
   - pull request obligatoire, aucun push direct ; 0 approbation requise tant
     que le développement est mené seul, 1 dès qu'un relecteur existe ;
   - check **`ci`** vert obligatoire, sur une branche à jour avec `main` ;
   - historique linéaire, suppression et push forcé interdits.
4. **CI** déclenchée par les pull requests vers `main`, les pushs sur `main`
   (base de `nx affected`) et le lancement manuel. Le job s'appelle `ci` : c'est
   le nom du check exigé par le ruleset.
5. **Fusion par « Rebase and merge »** : chaque cycle TDD reste un commit de
   `main`, l'historique montre comment la fonctionnalité a été construite.
   Commits de fusion désactivés ; branches supprimées après fusion.
6. **Avant de fusionner** : CI verte et revue d'architecture qui cite les règles
   `TENETS-XXX-NNN` concernées (ADR-0005).
7. **Alertes** : notification par e-mail des workflows en échec.

## Conséquences

- Un push sur une branche sans pull request ne lance plus la CI : ouvrir la PR
  tôt (au besoin en brouillon) ou lancer le workflow à la main.
- Un agent ne peut ni pousser sur `main` ni fusionner une CI rouge.
- Renommer le job `ci` oblige à mettre à jour le ruleset.
