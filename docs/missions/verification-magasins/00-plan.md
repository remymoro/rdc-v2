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

L'étape 3 (magasins) passe avant le lot 3 : le contrat « magasins actifs par
centre » s'appuie sur le vrai repository `Magasin`, sans requête provisoire sur
la table v1. RDC-REF-006 est reportée à l'étape 5 (comme RDC-REF-004) et
RDC-REF-009 reste ⚠️ ; le reste de l'étape 3 n'est pas bloqué.

```text
Lot 1  Design doc collecte + vérification            (doc seulement)
  │
Lot 2  Créer une collecte                            ← décision D-12
  │                                    Étape 3  Magasins : créer, rattacher, statuts
  │                                      │      (hors mission, en parallèle des lots 1 et 2)
  ├── Lot 3  Inscrire les magasins + reprise N-1 ◄──┘ (contrat « magasins actifs par centre »)
  │
  └── Lot 4  Domaine : ListeVerification              (parallèle au lot 3)
        │
      Lot 5  Use cases de la vérification              (après lots 3 et 4)
        │
      Lot 6  Persistance Prisma de la vérification
        │
      Lot 7  HTTP + E2E                               ← étape 4 (rôles) terminée
```

## Suivi

| Lot | Brief                               | Branche                                  | Prérequis               | État      |
| --- | ----------------------------------- | ---------------------------------------- | ----------------------- | --------- |
| 1   | `lot-1-design-collecte.md`          | `docs/collecte-design`                   | —                       | 🟢 prêt   |
| 2   | `lot-2-creer-collecte.md`           | `feat/collecte-creer`                    | lot 1 fusionné, D-12    | ⏸ bloqué |
| 3   | `lot-3-inscrire-magasins.md`        | `feat/collecte-inscrire-magasins`        | lot 2, étape 3          | ⏸ bloqué |
| 4   | `lot-4-verification-domaine.md`     | `feat/collecte-verification-domaine`     | lot 2                   | ⏸ bloqué |
| 5   | `lot-5-verification-use-cases.md`   | `feat/collecte-verification-use-cases`   | lots 3 et 4             | ⏸ bloqué |
| 6   | `lot-6-verification-persistance.md` | `feat/collecte-verification-persistance` | lot 5                   | ⏸ bloqué |
| 7   | `lot-7-verification-http.md`        | `feat/collecte-verification-http`        | lot 6, étape 4 terminée | ⏸ bloqué |

États : 🟢 prêt · 🔵 en cours (Codex) · 🟣 en revue (Claude) · ✅ fusionné · ⏸ bloqué.

## Décisions à prendre avant les lots concernés

| Décision | Question                                                             | Bloque | Proposition                               |
| -------- | -------------------------------------------------------------------- | ------ | ----------------------------------------- |
| D-12     | Fuseau de l'année d'une collecte (RDC-COLLECTE-022)                  | lot 2  | Année civile `Europe/Paris`               |
| V-1      | « Avis » = commentaire global du centre à la transmission ?          | lot 4  | Oui, facultatif                           |
| V-2      | Transmettre avec des magasins encore « à contacter » ?               | lot 4  | Oui, signalés au siège comme non vérifiés |
| V-3      | Le siège voit-il l'avancement avant transmission ?                   | lot 5  | Oui, en lecture seule                     |
| V-4      | Une liste non transmise bloque-t-elle le démarrage ?                 | lot 4  | Non, avertissement seulement              |
| Client   | Le responsable de centre saisit les réponses dans RDC (COLLECTE-014) | lot 7  | À présenter avant la mise en service      |

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
