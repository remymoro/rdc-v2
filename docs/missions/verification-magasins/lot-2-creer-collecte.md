# Lot 2 — Créer une collecte (fondation du contexte `collecte`)

- **Branche :** `feat/collecte-creer`
- **Prérequis :** lot 1 fusionné (D-12 décidée : année civile Europe/Paris)
- **Révisé après le lot 1 :** le 2026-10-01, d'après `docs/design/collecte.md`

## Ordre de mission (à coller dans Codex)

```text
Tu travailles dans le dépôt rdc-v2. Lis d'abord AGENTS.md, puis
docs/missions/verification-magasins/00-plan.md et
docs/missions/verification-magasins/lot-2-creer-collecte.md : ce dernier est ton ordre de mission
complet. Exécute le lot sur la branche feat/collecte-creer, créée depuis main à jour.
Travaille en TDD : un test rouge, le code minimal, le nettoyage, un commit par
cycle, dans l'ordre des cycles du brief. Termine par `pnpm agent:gate -- --full`, puis
ouvre une pull request dont la description cite les règles RDC-… et TENETS-…
appliquées, les cycles réalisés et la section « Hors périmètre ».
```

## Objectif

Créer les libs `collecte/{domain,application,adapters}` et la première
tranche verticale complète : créer une collecte en PREPARATION, du domaine à
`POST /api/collectes`, comme `Centre` à l'étape 1 (même structure, même
démarche). Ce lot livre aussi la première migration additive du contexte
(design, section « Persistance additive ») ; le lot 6 n'ajoutera que les
tables de la vérification.

## À lire

- `docs/design/collecte.md` : agrégat `Collecte`, persistance additive,
  erreurs et statuts HTTP
- ADR-0008 (schéma v1 repris), ADR-0009 (contrat HTTP v1), ADR-0016 (année
  Europe/Paris)
- `docs/domaine/collecte.md` : RDC-COLLECTE-001, 006, 012, 022
- `docs/architecture/regles/15-structure.md` (génération des libs et tags)
- Exemple à imiter : `libs/referentiel/**` (création de centre)

## Cycles TDD (dans l'ordre)

1. `CollecteId` : vide, format UUID.
2. `NomCollecte` : vide, longueur maximale, espaces.
3. `PeriodeCollecte.creer(debut, fin, maintenant)` : début dans le passé
   refusé, fin <= début refusée, fin à minuit = journée entière, une seule
   fonction de fin de journée (RDC-COLLECTE-006).
4. `PeriodeCollecte.reconstituer` : n'applique pas « début non passé ».
5. Année de la collecte : année civile Europe/Paris de la date de début
   (D-12, ADR-0016, RDC-COLLECTE-022), une seule fonction, testée sur un début au
   1er janvier à 0 h 30 heure de Paris (31 décembre en UTC).
6. `Collecte.creer` : statut PREPARATION, planification fermée, vérification
   NON_OUVERTE (`EtatVerification` : NON_OUVERTE / OUVERTE / FERMEE), aucune
   participation, version 0, `creeLe = modifieLe = maintenant`.
7. `CreerCollecteUseCase` : refus nom existant (`CollecteDejaExistante`,
   `COLLECTE_ALREADY_EXISTS`, RDC-COLLECTE-012) et année occupée
   (`COLLECTE_ANNEE_DEJA_EXISTANTE`), dans l'unité de travail.
8. Suite de contrat `CollecteRepository` + fake en mémoire.
9. Migration additive : `Collecte.etatVerification` (enum `EtatVerification`,
   défaut NON_OUVERTE) et `Collecte.version` (défaut 0), sans toucher aux
   colonnes v1 (`dateFinSaisie`, `saisieOuverte` restent en place).
10. `PrismaCollecteRepository` sur la table v1 étendue (passe la même suite).
    Le contrôle de version à l'écriture (ADR-0015) arrive au lot 6 : ce lot
    ne fait que créer, protégé par les contraintes uniques.
11. `POST /api/collectes` : DTO de forme, filtre d'erreurs du contexte, E2E
    (201, 400, 409 pour le nom comme pour l'année, statuts du design).

## Hors périmètre

Démarrer, modifier, clôturer, planification, participations, vérification,
contrôle de rôle (étape 4 : route non protégée, déploiement toujours bloqué par
`verifierDeploiementAutorise`).

## Critères d'acceptation

- [ ] Libs générées avec les tags `context:collecte` et `layer:*` ; le lint
      d'architecture passe.
- [ ] Aucun `new Date()` sans argument dans `domain` et `application`.
- [ ] RDC-COLLECTE-006, 012 et 022 passent à ✅ ; feuille de route à jour.
- [ ] `pnpm agent:gate -- --full` passe.
