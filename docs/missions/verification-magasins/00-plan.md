# Mission — Vérification de la participation des magasins

- **Ouverte le :** 2026-10-01
- **Décision métier :** D-02 (`docs/domaine/a-trancher.md`)
- **Règles :** RDC-COLLECTE-004, 014 à 021 (`docs/domaine/collecte.md`)
- **Exécutant :** Codex, un lot = une branche = une pull request
- **Orchestration et relecture :** Claude Code
- **Décisions métier :** l'utilisateur (et le client pour COLLECTE-014)

## Objectif

Le siège AD47 ouvre la vérification d'une collecte. Chaque centre reçoit une
liste préremplie de ses magasins, saisit ce que ses bénévoles rapportent
(participe / ne participe pas), puis transmet sa liste au siège avec son avis.
Le siège peut renvoyer une liste au centre, puis inscrit en lot les magasins qui
participent.

## Dépendances

La vérification vit dans le contexte `collecte`, qui n'existe pas encore
(étape 5). Elle a besoin de la liste des magasins actifs par centre (contrat
publié par `referentiel`), et de rôles pour l'HTTP (étape 4).

L'étape 3 (magasins) n'est plus bloquée (2026-10-01) : RDC-REF-006 est
reportée à l'étape 5 (D-03 reste à trancher d'ici là) et D-04 est décidée
(convention v1, pas de champ `enseigne`). L'étape 3 passe avant le lot 3, dont
le contrat publié « magasins actifs par centre » s'appuie sur le vrai
repository `Magasin`.

```text
Lot 1  Design doc collecte + vérification            ✅ fusionné (docs/design/collecte.md)
  │
Lot 2  Créer une collecte : tranche complète, Prisma, POST /api/collectes
  │                                    Étape 3  Magasins : lots A1 et A2
  │                                      │      (hors mission, en parallèle du lot 2)
  ├── Lot 3  Inscrire les magasins + reprise N-1 ◄──┘ (contrat publié, ADR-0014 à accepter)
  └── Lot 4  Domaine : ListeVerification
        │      (3 et 4 en parallèle)
        ├── Lot 2b Démarrer une collecte et figer les listes (après lot 4)
        │
      Lot 5  Use cases de la vérification              (après lots 2b, 3 et 4)
        │
      Lot 6  Persistance Prisma de la vérification     (ADR-0015 à accepter)
        │      + déclenchement du démarrage dans apps/api
      Lot 7  HTTP + E2E                               ← étape 4 (rôles) terminée
```

Découpage révisé le 2026-10-01 après la fusion du design (lot 1, constat M-1
de la revue) : le lot 2 est une tranche verticale complète, le lot 2b passe
après le lot 4 pour figer les listes au démarrage, et le lot 6 n'ajoute que
les tables de la vérification. Le déclenchement automatique du démarrage dans
`apps/api` passe du lot 2b au lot 6 : il a besoin du repository Prisma des
listes, et l'API ne peut pas être déployée avant l'étape 4
(`verifierDeploiementAutorise`), donc ce report ne retarde aucun usage réel.

## Suivi

| Lot | Brief                               | Branche                                  | Prérequis                         | État             |
| --- | ----------------------------------- | ---------------------------------------- | --------------------------------- | ---------------- |
| 1   | `lot-1-design-collecte.md`          | `docs/collecte-design`                   | —                                 | ✅ fusionné (#9) |
| 2   | `lot-2-creer-collecte.md`           | `feat/collecte-creer`                    | lot 1 fusionné                    | 🟢 prêt          |
| 3   | `lot-3-inscrire-magasins.md`        | `feat/collecte-inscrire-magasins`        | lot 2, étape 3 (A1, A2), ADR-0014 | ⏸ bloqué        |
| 4   | `lot-4-verification-domaine.md`     | `feat/collecte-verification-domaine`     | lot 2, V-1, V-2, V-4              | ⏸ bloqué        |
| 2b  | `lot-2b-demarrer-collecte.md`       | `feat/collecte-demarrer`                 | lots 2 et 4                       | ⏸ bloqué        |
| 5   | `lot-5-verification-use-cases.md`   | `feat/collecte-verification-use-cases`   | lots 2b, 3, 4, V-3                | ⏸ bloqué        |
| 6   | `lot-6-verification-persistance.md` | `feat/collecte-verification-persistance` | lot 5, ADR-0015                   | ⏸ bloqué        |
| 7   | `lot-7-verification-http.md`        | `feat/collecte-verification-http`        | lot 6, étape 4 terminée, client   | ⏸ bloqué        |

États : 🟢 prêt · 🔵 en cours (Codex) · 🟣 en revue (Claude) · ✅ fusionné · ⏸ bloqué.

## Décisions à prendre avant les lots concernés

| Décision | Question                                                             | Bloque | Proposition                                |
| -------- | -------------------------------------------------------------------- | ------ | ------------------------------------------ |
| V-1      | « Avis » = commentaire global du centre à la transmission ?          | lot 4  | Oui, facultatif                            |
| V-2      | Transmettre avec des magasins encore « à contacter » ?               | lot 4  | Oui, signalés au siège comme non vérifiés  |
| V-3      | Le siège voit-il l'avancement avant transmission ?                   | lot 5  | Oui, en lecture seule                      |
| V-4      | Une liste non transmise bloque-t-elle le démarrage ?                 | lot 4  | Non, avertissement seulement               |
| V-5      | Magasin transféré pendant la vérification                            | lot 5  | ✅ Décidée : reste dans sa liste d'origine |
| ADR-0014 | Contrats publiés entre contextes (`libs/<contexte>/contrat`)         | lot 3  | À accepter (statut « proposé »)            |
| ADR-0015 | Concurrence optimiste de `Collecte` et `ListeVerification`           | lot 6  | À accepter (statut « proposé »)            |
| Client   | Le responsable de centre saisit les réponses dans RDC (COLLECTE-014) | lot 7  | À présenter avant la mise en service       |

V-1 à V-4 sont les choix par défaut inscrits dans COLLECTE-016 à 020 : une
réponse différente modifie la règle avant le lot, pas pendant.

## Boucle de travail pour chaque lot

1. **Claude** vérifie les prérequis, met à jour le brief si un lot précédent a
   changé la donne, et passe le lot à 🟢.
2. **L'utilisateur** colle dans Codex le bloc « Ordre de mission » du brief.
3. **Codex** travaille sur sa branche : cycles TDD, un commit par cycle,
   `pnpm agent:gate` (et `-- --full` si Prisma ou HTTP), pull request dont la
   description cite les règles `RDC-…` et `TENETS-…` appliquées.
4. **Claude** relit la PR et écrit la revue dans
   `docs/revues/AAAA-MM-JJ-<lot>.md` : constats classés, règle citée, fichier
   et ligne. Verdict : `a-corriger` ou `acceptee`.
5. Si `a-corriger` : l'utilisateur renvoie la revue à Codex (« corrige les
   constats de `docs/revues/…` »), retour à l'étape 4.
6. **L'utilisateur** fusionne quand la CI est verte et la revue `acceptee`.
   Claude met à jour le tableau de suivi et la feuille de route.

## Règles communes à tous les lots

- Lire `AGENTS.md`, puis `docs/domaine/collecte.md` et les fichiers
  d'architecture indiqués dans le brief, avant d'écrire du code.
- Ne jamais implémenter une règle marquée ⚠️ : s'arrêter et le signaler dans
  la PR.
- Ne rien changer hors du périmètre du lot. Un besoin hors périmètre se note
  dans la PR, section « Hors périmètre ».
- Vocabulaire du glossaire uniquement (`ListeVerification`, `transmettre`,
  `renvoyer`, `ReponseMagasin`…) ; un terme manquant s'ajoute au glossaire dans
  la même PR.
- Mettre à jour la feuille de route et l'état des règles (⏳ → ✅) dans la PR
  qui les implémente.
- Ne jamais pousser sur `main`, ne jamais fusionner soi-même.
