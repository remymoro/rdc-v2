# Lot 1 — Design doc du contexte `collecte` et de la vérification

- **Branche :** `docs/collecte-design`
- **Type :** documentation uniquement, aucun fichier dans `libs/` ni `apps/`
- **Prérequis :** aucun
- **Livrable :** `docs/design/collecte.md`, ADR si une décision s'écarte de la v1

## Ordre de mission (à coller dans Codex)

```text
Tu travailles dans le dépôt rdc-v2. Lis d'abord AGENTS.md, puis
docs/missions/verification-magasins/00-plan.md et
docs/missions/verification-magasins/lot-1-design-collecte.md : ce dernier est
ton ordre de mission complet. Exécute le lot 1 sur la branche
docs/collecte-design, créée depuis main à jour. Ne modifie aucun fichier dans
libs/ ni apps/. Termine par `pnpm agent:gate`, puis ouvre une pull request
dont la description suit la section « Description de la PR » du brief.
```

## Contexte

La feuille de route exige un design doc avant l'étape 5, parce que `collecte`
touche plusieurs contextes, le modèle de données et des cycles de vie
complexes. La vérification des magasins (D-02) ajoute un second agrégat et deux
contrats inter-contextes. Les lots 2 à 7 seront ajustés d'après ce document.

## À lire

- `docs/domaine/00-index.md`, `glossaire.md`, `collecte.md` (en entier),
  `referentiel.md` (RDC-REF-004, 005, 010), `identite-acces.md` (RDC-ACCES-002, 003)
- `docs/architecture/regles/05-agregats-services.md`, `09-unit-of-work.md`,
  `10-contextes.md`, `11-evenements.md`, `15-structure.md`
- ADR-0003, ADR-0008 (schéma Prisma v1 repris), ADR-0009 (contrat HTTP v1),
  ADR-0013 (concurrence)
- Référence v1 : `../rdc/libs/domain/src/collecte/`, `../rdc/apps/api/prisma/schema.prisma`

## Ce que le design doc doit trancher

1. **Agrégats et frontières** (TENETS-AGGREGATE-003) :
   - `Collecte` : statut, période, planification, drapeau d'attente de
     clôture, participations, **état de la vérification** (fermée / ouverte /
     terminée).
   - `ListeVerification` : une par couple (collecte, centre), avec ses
     réponses et son état EN_COURS / TRANSMISE / RENVOYEE.
   - `SaisieCentre` : agrégat séparé ou partie de `Collecte` ? Justifier.
   - Pour chaque invariant de COLLECTE-001 à 021 : quel agrégat le garantit.
   - Pour chaque invariant qui traverse deux agrégats (ex. « ouvrir la
     vérification crée les listes », « inscription en lot ») : use case et
     unité de travail qui le portent.
2. **Contrats inter-contextes** (TENETS-CONTEXT-006) :
   - consommé : `referentiel` → « magasins actifs rattachés à chaque centre
     actif ». Proposer le port (côté `collecte/application`) et son
     implémentation, publiée par `referentiel` et appuyée sur le repository
     `Magasin` de l'étape 3, prévue avant le lot 3 (voir `00-plan.md`) ;
   - publiés : les questions de COLLECTE-013 (tableau), avec signature.
3. **Modèle de données** : tables v1 réutilisées telles quelles (ADR-0008) et
   **migrations additives** pour la vérification (tables, colonnes, index,
   contraintes d'unicité, dont une liste unique par collecte × centre). Aucune
   suppression ni renommage de colonne v1.
4. **Concurrence** : écritures simultanées de 14 responsables sur leurs
   listes ; inscription en lot pendant qu'un centre modifie. Proposer
   verrouillage optimiste ou dernier qui écrit gagne, en citant ADR-0013.
5. **Erreurs** : liste des classes d'erreur et de leurs codes stables
   (codes v1 repris quand ils existent, nouveaux codes pour la vérification),
   avec le statut HTTP visé.
6. **Routes HTTP** de la vérification (nouvelles, aucune contrainte v1) et
   rôle requis pour chacune.
7. **Découpage confirmé ou corrigé** des lots 2 à 7 du plan.

## Hors périmètre

- Planification, saisie des poids, statistiques : seulement les contrats que
  `collecte` leur publie.
- Toute règle ⚠️ (D-07, D-12, D-13) : la signaler comme hypothèse ouverte, ne
  pas la trancher.

## Critères d'acceptation

- [ ] Chaque règle RDC-COLLECTE-001 à 022 est rattachée à un agrégat ou à un
      use case, ou déclarée hors périmètre avec une raison.
- [ ] Le schéma des nouvelles tables est donné en Prisma, et la migration est
      décrite comme additive.
- [ ] Les deux sens des contrats inter-contextes sont spécifiés (port,
      implémentation, contexte propriétaire).
- [ ] Les hypothèses ouvertes sont listées avec la décision qui les tranche.
- [ ] `pnpm agent:gate` passe.

## Description de la PR

```markdown
## Lot 1 — Design doc collecte et vérification

Mission : docs/missions/verification-magasins/00-plan.md

### Décisions proposées

- …

### Hypothèses ouvertes (à trancher par l'utilisateur)

- …

### Changements proposés pour les lots 2 à 7

- …

### Règles citées

RDC-COLLECTE-…, TENETS-AGGREGATE-…, TENETS-CONTEXT-…
```
