# Lot 4 — Domaine de la vérification : `ListeVerification`

- **Branche :** `feat/collecte-verification-domaine`
- **Prérequis :** lot 2 fusionné ; V-1, V-2 et V-4 confirmées (`00-plan.md`)
- **Révisé après le lot 1 :** le 2026-10-01 (états, historique, version, V-5)
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
2. `Collecte.ouvrirVerification` : NON_OUVERTE → OUVERTE, en PREPARATION
   seulement, une seule fois (`VerificationDejaOuverte`) ;
   `fermerVerification` : OUVERTE → FERMEE (`VERIFICATION_FERMEE` ensuite).
3. `ListeVerification.creer` : magasins en « à contacter », indication « a
   participé à la collecte précédente », état EN_COURS.
4. `ajouterMagasin` (magasin créé ou réactivé depuis) ; un doublon dans la
   même liste est sans effet. Le refus d'un magasin présent dans la liste
   d'un autre centre (`MAGASIN_DEJA_DANS_UNE_LISTE`, V-5) est une règle du
   use case (lot 5), pas de cet agrégat.
5. `repondre(magasinId, reponse, { auteur, commentaire }, maintenant)` :
   auteur et date conservés ; `MagasinHorsListe`.
6. `transmettre({ auteur, avis }, maintenant)` : EN_COURS ou RENVOYEE →
   TRANSMISE ; possible avec des « à contacter » (V-2) ;
   `ListeDejaTransmise`. Chaque transmission entre dans un historique
   immuable (auteur, date, avis) ; le dernier avis reste lisible sur la liste.
7. Réponse refusée sur une liste TRANSMISE (`ListeDejaTransmise`).
8. `renvoyer({ auteur, raison }, maintenant)` : TRANSMISE → RENVOYEE ; raison
   d'au moins 3 caractères après suppression des espaces (`RaisonRenvoiInvalide`) ;
   `ListeNonTransmise`. Chaque renvoi entre dans l'historique immuable, qui
   conserve plusieurs cycles TRANSMISE → RENVOYEE → TRANSMISE.
9. `figer(maintenant)` (fermeture ou démarrage) : date de gel, plus aucun
   ajout, réponse, transmission ni renvoi (`VerificationFermee`), sans
   quatrième état.
10. `magasinsQuiParticipent()` et compteurs d'avancement.
11. `ListeVerification.reconstituer` : état persisté restitué, historique et
    version compris, sans revalidation des règles de création.
12. Port `ListeVerificationRepository` (une liste par collecte × centre,
    listes d'une collecte), suite de contrat et fake en mémoire avec contrôle
    de version : une sauvegarde sur une version périmée lève
    `LISTE_VERIFICATION_CONCURRENT_UPDATE` (ADR-0015, TENETS-AGGREGATE-007).

## Hors périmètre

Use cases, persistance Prisma, HTTP, contrôle du centre de l'utilisateur
(lot 5).

## Critères d'acceptation

- [ ] Aucune dépendance hors `collecte/domain` et `shared-kernel`.
- [ ] Chaque erreur a une classe et un code stable (ADR-0003 R6).
- [ ] Les termes du glossaire sont utilisés tels quels.
- [ ] `pnpm agent:gate` passe.
