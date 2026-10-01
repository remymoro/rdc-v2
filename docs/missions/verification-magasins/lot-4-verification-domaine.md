# Lot 4 — Domaine de la vérification : `ListeVerification`

- **Branche :** `feat/collecte-verification-domaine`
- **Prérequis :** lot 2 fusionné ; V-1, V-2 et V-4 confirmées (`00-plan.md`)
- **Peut avancer en parallèle du lot 3** (conflits possibles sur `index.ts` uniquement)

## Ordre de mission (à coller dans Codex)

```text
Tu travailles dans le dépôt rdc-v2. Lis d'abord AGENTS.md, puis
docs/missions/verification-magasins/00-plan.md et
docs/missions/verification-magasins/lot-4-verification-domaine.md : ce dernier est ton ordre de mission
complet. Exécute le lot sur la branche feat/collecte-verification-domaine, créée depuis main à jour.
Travaille en TDD : un test rouge, le code minimal, le nettoyage, un commit par
cycle, dans l'ordre des cycles du brief. Termine par `pnpm agent:gate`, puis
ouvre une pull request dont la description cite les règles RDC-… et TENETS-…
appliquées, les cycles réalisés et la section « Hors périmètre ».
```

## Objectif

Le cœur métier de la vérification, en TypeScript pur, sans base ni HTTP.

## À lire

- `docs/domaine/collecte.md` : section « Préparation » et RDC-COLLECTE-014,
  015, 018, 020, 021
- `docs/design/collecte.md` (agrégats)
- `docs/architecture/regles/04-entites-valeurs.md`, `05-agregats-services.md`,
  `06-creation-reconstitution.md`, `12-erreurs.md`, `14-tests.md`

## Cycles TDD (dans l'ordre)

1. `ReponseMagasin` : A_CONTACTER, PARTICIPE, NE_PARTICIPE_PAS.
2. `Collecte.ouvrirVerification` : en PREPARATION seulement, une seule fois
   (`VerificationDejaOuverte`) ; `fermerVerification`.
3. `ListeVerification.creer` : magasins en « à contacter », indication « a
   participé à la collecte précédente », état EN_COURS.
4. `ajouterMagasin` (magasin créé depuis) ; refus d'un doublon.
5. `repondre(magasinId, reponse, { auteur, commentaire }, maintenant)` :
   auteur et date conservés ; `MagasinHorsListe`.
6. `transmettre({ auteur, avis }, maintenant)` : EN_COURS ou RENVOYEE →
   TRANSMISE ; possible avec des « à contacter » (V-2) ;
   `ListeDejaTransmise`.
7. Réponse refusée sur une liste TRANSMISE (`ListeDejaTransmise`).
8. `renvoyer({ auteur, raison }, maintenant)` : TRANSMISE → RENVOYEE ; raison
   > = 3 caractères après suppression des espaces (`RaisonRenvoiInvalide`) ;
   > `ListeNonTransmise`.
9. `figer()` (fermeture ou démarrage) : plus aucune réponse, transmission ni
   renvoi (`VerificationFermee`).
10. `magasinsQuiParticipent()` et compteurs d'avancement.
11. `ListeVerification.reconstituer` : état persisté restitué sans
    revalidation des règles de création.

## Hors périmètre

Use cases, persistance, HTTP, contrôle du centre de l'utilisateur (lot 5).

## Critères d'acceptation

- [ ] Aucune dépendance hors `collecte/domain` et `shared-kernel`.
- [ ] Chaque erreur a une classe et un code stable (ADR-0003 R6).
- [ ] Les termes du glossaire sont utilisés tels quels.
- [ ] `pnpm agent:gate` passe.
