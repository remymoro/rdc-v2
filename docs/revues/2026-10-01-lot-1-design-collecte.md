# Revue — Lot 1 : design doc du contexte `collecte`

- **Date :** 2026-10-01
- **Branche relue :** `docs/collecte-design`, commit `5265b4c`
- **Fichiers :** `docs/design/collecte.md`, ADR-0014, ADR-0015
- **Relecteur :** Claude Code (orchestrateur de la mission)
- **Verdict :** `a-corriger` (3 constats bloquants, 2 à décider, 2 mineurs)
- **Agent Gate :** `pnpm agent:gate` passe

## Consignes pour l'agent qui corrige

1. Corrige sur la même branche, un commit par constat, au format
   `docs(collecte): …` (ADR-0010).
2. Ne touche ni à `libs/` ni à `apps/`, ni aux briefs de mission : le découpage
   des lots est mis à jour par l'orchestrateur après la fusion.
3. Pour I-1 et I-2, applique la décision notée dans la section « Décisions »
   ci-dessous ; si elle est vide, ne change rien et signale-le dans la PR.
4. Termine par `pnpm agent:gate`, puis ouvre la pull request (B-1).

## Ce qui est bien fait

- Trois racines séparées (`Collecte`, `ListeVerification`, `SaisieCentre`), avec
  une justification par la concurrence réelle des 14 centres
  (TENETS-AGGREGATE-002/003).
- Chaque règle RDC-COLLECTE-001 à 022 est attribuée à un agrégat ou à un use case.
- Le sens des contrats entre contextes est correct : contrat publié par le
  fournisseur, port consommateur, adapter de traduction (TENETS-CONTEXT-002 à 005).
- L'inscription en lot revalide l'état actuel des magasins au lieu de se fier
  à l'instantané d'ouverture, sans succès partiel.
- Historique immuable des transmissions et renvois (RDC-COLLECTE-020/021).
- Aucune décision ⚠️ n'est tranchée en douce (D-03, D-07, D-12, D-13).

## Constats bloquants

### B-1 — Pas de pull request, message de commit hors convention

La branche est poussée mais aucune PR n'est ouverte : la CI ne s'est pas lancée
et la revue Copilot exigée par le ruleset non plus. Le brief demandait une PR
avec la section « Description de la PR ». Le commit `Docs: concevoir…` ne suit
pas la convention `docs(<portée>): …` (ADR-0010 §2).

**Correction.** Reformuler le message (`docs(collecte): concevoir le contexte
collecte et sa vérification`) puis ouvrir la PR selon le brief.

### B-2 — Statuts HTTP différents de la v1 sans ADR

`docs/design/collecte.md`, section « Erreurs et statuts HTTP visés ». Dans la
v1, `COLLECTE_STATUT_INVALIDE`, `COLLECTE_MODIFICATION_INTERDITE`,
`COLLECTE_REASSIGNATION_INTERDITE`, `MAGASIN_NON_INSCRIT`,
`COLLECTE_DEMARRAGE_AVANT_DATE_DEBUT` et `COLLECTE_AUCUN_MAGASIN_INSCRIT` sont
des `DomainValidationException`, donc **400** (`../rdc/apps/api/src/presentation/http/filters/domain-exception.filter.ts:42`).
Le design les passe en 409 ou 404. ADR-0009 §1 conserve les statuts v1 pour que
le front v1 continue de fonctionner (TENETS-API-001).

**Correction.** Garder les statuts v1 pour tous les codes qui existent déjà en
v1. N'utiliser 409/404 que pour les codes nouveaux de la v2 (vérification,
concurrence). Si un changement de statut v1 est voulu, l'écrire dans un ADR.

### B-3 — « Fermer la vérification » mène à l'état TERMINEE, et FERMEE veut dire « jamais ouverte »

`docs/design/collecte.md`, sections `Collecte` et « Persistance additive »
(`enum EtatVerification { FERMEE, OUVERTE, TERMINEE }`). Le glossaire et
RDC-COLLECTE-018 disent que l'admin **ferme** la vérification. Avec ces noms,
`fermerVerification()` produirait l'état TERMINEE, tandis que FERMEE désignerait
l'état initial : un agent ou un relecteur confondra les deux (TENETS-NAME-001).
TERMINEE est en plus déjà un statut de `Collecte`.

**Correction.** `EtatVerification { NON_OUVERTE, OUVERTE, FERMEE }`, partout
(texte, Prisma, tableau des erreurs : `VERIFICATION_FERMEE` au lieu de
`VERIFICATION_TERMINEE`).

## À décider avant correction

### I-1 — Lot 2 sans Prisma ni HTTP

Le découpage corrigé reporte toute la persistance au lot 6 et toute l'API au
lot 7 : la collecte n'aurait ni base ni route pendant cinq lots. La démarche de
la feuille de route fait chaque fonctionnalité en tranche complète (domaine →
application → adapters → HTTP), comme les étapes 1 et 2. La crainte de deux
migrations concurrentes se règle par l'ordre des lots, pas par le report.

**Proposition de l'orchestrateur.** Lot 2 garde Prisma et `POST /api/collectes`,
avec une migration additive pour `Collecte.version` et `etatVerification`. Le
lot 6 n'ajoute que les tables de la vérification. Les migrations restent dans
des lots séquentiels (2 puis 6).

### I-2 — Ajouter un magasin à une liste : centre dans l'URL ou centre de rattachement ?

La route `POST …/listes/:centreId/magasins/:magasinId` choisit la liste par
l'URL, alors que le workflow « Ajouter un magasin à une liste ouverte » la
déduit du centre de rattachement. Les deux peuvent se contredire.

**Proposition de l'orchestrateur.** Route `POST …/verification/magasins/:magasinId` ;
la liste est celle du centre de rattachement (RDC-COLLECTE-014).

## Mineurs

- **M-1.** Le lot 2b passe après le lot 4 pour figer les listes au démarrage :
  accepté. L'orchestrateur mettra à jour `00-plan.md` et les briefs après la fusion.
- **M-2.** ADR-0014 et ADR-0015 sont « proposés » : l'utilisateur doit les
  accepter avant les lots 3 et 6 (prérequis notés dans le design).

## Décisions

| Point | Décision                                                                                                                                                     | Date       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| I-1   | Proposition retenue : lot 2 complet (Prisma, migration `version` et `etatVerification`, `POST /api/collectes`) ; lot 6 = tables de la vérification seulement | 2026-10-01 |
| I-2   | Proposition retenue : `POST …/verification/magasins/:magasinId`, liste du centre de rattachement                                                             | 2026-10-01 |
