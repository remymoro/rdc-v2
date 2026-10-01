# Lot 7 — HTTP et E2E de la vérification

- **Branche :** `feat/collecte-verification-http`
- **Prérequis :** lot 6 fusionné ; **étape 4 terminée** (guard de rôle,
  utilisateur courant dans la requête) ; présentation au client faite

## Ordre de mission (à coller dans Codex)

```text
Tu travailles dans le dépôt rdc-v2. Lis d'abord AGENTS.md, puis
docs/missions/verification-magasins/00-plan.md et
docs/missions/verification-magasins/lot-7-verification-http.md : ce dernier est ton ordre de mission
complet. Exécute le lot sur la branche feat/collecte-verification-http, créée depuis main à jour.
Travaille en TDD : un test rouge, le code minimal, le nettoyage, un commit par
cycle, dans l'ordre des cycles du brief. Termine par `pnpm agent:gate -- --full`, puis
ouvre une pull request dont la description cite les règles RDC-… et TENETS-…
appliquées, les cycles réalisés et la section « Hors périmètre ».
```

## Objectif

Exposer la vérification aux deux rôles, avec le contrôle de rôle unique de
l'étape 4 et le périmètre « son centre ».

## Cycles TDD (dans l'ordre)

1. Routes de l'admin : ouvrir, fermer, avancement, renvoyer, inscrire en lot.
2. Routes du responsable : sa liste, répondre, transmettre.
3. Filtre d'erreurs du contexte : codes et statuts du design doc.
4. E2E : parcours complet (ouvrir → répondre → transmettre → renvoyer →
   transmettre → inscrire en lot → fermer la vérification), et un test
   « refusé » par route : mauvais rôle (RDC-ACCES-003), autre centre
   (RDC-ACCES-002). Le figement au démarrage est couvert par les tests du
   lot 5 : le démarrage n'a pas de route HTTP.

## Critères d'acceptation

- [ ] Toutes les routes sont protégées par le guard de rôle.
- [ ] RDC-COLLECTE-014 à 018, 020 et 021 passent à ✅.
- [ ] `pnpm agent:gate -- --full` passe.
