# Feuille de route RDC v2

> Document vivant : à mettre à jour à chaque fonctionnalité terminée (étape 7
> de la démarche : capitaliser). Un agent qui reprend le travail commence ici.

## Démarche pour chaque fonctionnalité

1. Spécification courte (besoin, règles métier, critères d'acceptation).
2. Design doc si la fonctionnalité touche plusieurs contextes, le modèle de
   données ou un cycle de vie complexe.
3. Découpage en cycles TDD : domaine → application → adapters → HTTP.
4. Un cycle = un comportement : test rouge, code minimal, nettoyage, commit.
5. `pnpm nx format:check && pnpm verify` avant de pousser ; CI verte avant fusion.
6. Revue d'architecture qui cite les règles `TENETS-XXX-NNN`.
7. Mise à jour de ce document, du glossaire et des ADR si besoin.

## Pyramide des tests

| Niveau                                     | Où                                | Existe | En CI | Arrive avec |
| ------------------------------------------ | --------------------------------- | ------ | ----- | ----------- |
| Domaine (unitaires)                        | `libs/*/domain/**/*.spec.ts`      | ✅     | ✅    | —           |
| Use cases (fakes en mémoire)               | `libs/*/application/**/*.spec.ts` | ✅     | ✅    | —           |
| Contrat d'adapter (en mémoire puis Prisma) | `*.test-utils.ts` + `*.spec.ts`   | ✅     | ✅    | —           |
| Intégration (Prisma + PostgreSQL)          | `*.integration.spec.ts`           | ✅     | ✅    | —           |
| E2E HTTP boîte noire                       | `apps/api-e2e`                    | ✅     | ✅    | —           |

## Étapes

| Étape | Contenu                                                            | État       |
| ----- | ------------------------------------------------------------------ | ---------- |
| 0     | Fondations : Nx, lint d'architecture, CI, règles Tenets, ADR       | ✅ Terminé |
| 1     | Référentiel : créer un centre (domaine → use case → Prisma → HTTP) | ✅ Terminé |
| 2     | Référentiel : cycle de vie d'un centre (désactiver, archiver)      | ✅ Terminé |
| 3     | Référentiel : magasins et produits                                 | ✅ Terminé |
| 4     | Identité et accès : bootstrap admin, connexion, rôles              | ⏳         |
| 5     | Collecte : design doc, puis création et cycle de vie               | ⏳         |
| 6     | Planification, saisie, bénévoles                                   | ⏳         |
| 7     | Statistiques (modèle de lecture séparé)                            | ⏳         |
| 8     | Front Angular 22 dans le workspace (Node ≥ 24.15)                  | ⏳         |

L'ordre des étapes 3 à 7 reste à confirmer avec la carte des contextes.

## Outillage transverse

| Élément                                                                  | État |
| ------------------------------------------------------------------------ | ---- |
| Agent Gate local : politique, formatage, lint, tests et build (ADR-0012) | ✅   |
| Agent Gate complet : migrations, tests d'intégration et E2E (ADR-0012)   | ✅   |
| Revue humaine : preuves TDD et règles `TENETS-…` / `RDC-…` citées        | ⏳   |

## Étape 1 — Créer un centre

| Élément                                                                                       | État |
| --------------------------------------------------------------------------------------------- | ---- |
| `CentreId` : vide, format UUID, normalisation                                                 | ✅   |
| `Nom`, `Ville` : vide, longueur maximale, espaces                                             | ✅   |
| `CodePostal` : 5 chiffres ; `Adresse` : abréviations interdites (ADR-0006)                    | ✅   |
| `Telephone` (01-07, 09, `+33`, ADR-0007) et `Email` facultatifs                               | ✅   |
| `Centre.creer()` avec l'état initial complet ; `Centre.reconstituer()`                        | ✅   |
| `CleDoublonCentre` : clé de rapprochement de la v1                                            | ✅   |
| `CreerCentreUseCase` : création, enregistrement, refus des doublons (`CENTRE_ALREADY_EXISTS`) | ✅   |
| Suite de contrat `CentreRepository` (passée par le fake en mémoire)                           | ✅   |
| `PrismaCentreRepository` (passe la même suite, sur PostgreSQL, ADR-0008)                      | ✅   |
| `POST /api/centres`, filtres d'erreurs, tests E2E (ADR-0009)                                  | ✅   |

Avant la mise en production (ADR-0008) : script de reprise qui calcule
`cleDoublon` pour les centres de la v1, puis colonne rendue obligatoire. La
violation d'unicité est traduite en `CentreDejaExistant` depuis l'étape 3
(TENETS-ADAPTER-006).

⚠️ **Avant tout déploiement** : authentification sur toutes les routes du
référentiel (`/api/centres…`, `/api/magasins…`, `/api/produits…`), ADMIN pour
les écritures, périmètre « son centre » pour les lectures d'un responsable
(étape 4, ADR-0009). En attendant, l'API refuse de démarrer en production
(`verifierDeploiementAutorise`) : à supprimer à l'étape 4.

## Étape 2 — Cycle de vie d'un centre

| Élément                                                                                              | État |
| ---------------------------------------------------------------------------------------------------- | ---- |
| Domaine : désactiver un centre actif et dater la modification                                        | ✅   |
| Domaine : désactiver un centre déjà inactif sans modifier `modifieLe`                                | ✅   |
| Domaine : activer un centre inactif et dater la modification                                         | ✅   |
| Domaine : refuser d'activer ou désactiver un centre archivé                                          | ✅   |
| Domaine : activer un centre déjà actif sans modifier `modifieLe`                                     | ✅   |
| Domaine : archiver un centre actif ou inactif et dater la modification                               | ✅   |
| Domaine : archiver un centre déjà archivé sans effet (archivage définitif)                           | ✅   |
| Use cases : désactiver, activer, archiver (`CENTRE_NOT_FOUND` si inconnu)                            | ✅   |
| HTTP : `PATCH /api/centres/:id/{desactiver,activer,archiver}`, 204 sans corps (contrat v1, ADR-0009) | ✅   |
| HTTP : `CentreIntrouvable` → 404, `CentreArchive` → 409 (filtre du contexte)                         | ✅   |
| E2E : 204, 400 id mal formé, 404 centre inconnu, 409 centre archivé                                  | ✅   |

Concurrence : deux écritures simultanées sur un centre ne sont pas détectées,
« le dernier qui écrit gagne » comme en v1 (un seul administrateur, ADR-0013) ;
à revoir à l'étape 4 si un second rôle peut modifier un centre.

Données v1 invalides : une ligne qui ne respecte plus les value objects
(téléphone en 08, adresse abrégée…) lève `CentrePersisteInvalide` à la relecture,
donc un 500, y compris sur un simple `PATCH`. Le script de reprise de l'ADR-0008
doit aussi normaliser téléphones et adresses avant la mise en production.

Règles de la v1 reportées (décision du 2026-10-01) :

- **Étape 5 (Collecte)** : refuser de désactiver, activer ou archiver un centre
  gestionnaire de magasins dans une collecte `PREPARATION` ou `EN_COURS`
  (v1 : 400 `CENTRE_STATUT_MODIFICATION_INTERDITE_COLLECTES_ACTIVES`), via un
  contrat publié par Collecte (TENETS-CONTEXT-006).
- **Étape 4 (Identité)** : archiver un centre désactive ses responsables (v1 :
  même transaction). En v2, plutôt une réaction à un événement « centre archivé »
  émis par le domaine (TENETS-EVENT-002, AGGREGATE-006) ; l'événement n'est pas
  créé tant que personne ne le consomme.

## Étape 3 — Magasins, produits et fin des centres

Mission : `docs/missions/etape-3-magasins/00-plan.md`.

| Élément                                                                                                                            | État |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---- |
| A1 — `MagasinId`, `StatutMagasin`, `Magasin.creer()` / `reconstituer()` (rattachement au centre)                                   | ✅   |
| A1 — `CleDoublonMagasin` globale, règle de rapprochement partagée avec le centre                                                   | ✅   |
| A1 — `Centre.verifierOuvertAuxRattachements()` : `CENTRE_NON_ACTIF` (RDC-REF-010)                                                  | ✅   |
| A1 — Port `MagasinRepository`, suite de contrat, fake en mémoire                                                                   | ✅   |
| A1 — `CreerMagasinUseCase` : `CENTRE_NOT_FOUND`, `CENTRE_NON_ACTIF`, `MAGASIN_ALREADY_EXISTS`                                      | ✅   |
| A1 — Migration `Magasin.cleDoublon`, `PrismaMagasinRepository`, P2002 traduite en `MagasinDejaExistant`                            | ✅   |
| A1 — `POST /api/centres/:centreId/magasins`, filtre d'erreurs, E2E                                                                 | ✅   |
| A2 — Cycle de vie d'un magasin : désactiver, activer, archiver (`MAGASIN_ARCHIVED`, `MAGASIN_NOT_FOUND`)                           | ✅   |
| A3 — `PATCH /api/magasins/:id` : modifier (absent = inchangé, `null` = suppression), transférer, sans doublon                      | ✅   |
| A4 — Lire les magasins : `GET /api/magasins`, `/api/magasins/:id`, `/api/centres/:centreId/magasins` (port de lecture dédié)       | ✅   |
| B — Catalogue des produits : créer, modifier, activer, désactiver, lister (`/api/produits`)                                        | ✅   |
| Centres — Archivage refusé tant qu'un magasin actif ou inactif est rattaché (`CENTRE_A_DES_MAGASINS`, RDC-REF-011, D-18)           | ✅   |
| Centres — Lire : `GET /api/centres` (statut, recherche, tri), `/api/centres/:id`, avec le nombre de magasins actifs et inactifs    | ✅   |
| Centres — `PATCH /api/centres/:id` : modifier (absent = inchangé, `null` = suppression), sans doublon, archivé refusé              | ✅   |
| Centres — Filet P2002 : `CentreDejaExistant` déclaré par le port, deux contraintes uniques traduites                               | ✅   |
| C — Images d'un magasin : ajouter, retirer (`/api/magasins/:id/images`), dossier `UPLOADS_DIR`, nettoyage des orphelins (ADR-0021) | ✅   |

Produits : pas d'unicité du code (retirée volontairement en v1, migration
`remove_produit_code_unique`) ; forme de `ProduitDto` et tri par code à vérifier
contre la v1.

Lectures des centres : tri par nom par défaut, ou `?tri=statut|magasins` et
`?ordre=desc` (tri en mémoire dans la requête applicative : une douzaine de
centres) ; la recherche ignore la casse mais pas les
accents (« Nerac » ne trouve pas « Nérac ») et porte sur le nom ou la ville ;
la réponse ajoute `magasins: { actifs, inactifs }` (compteurs) au `CentreDto`
de la v1. `POST` et `PATCH` renvoient le `CentreDto` de la v1, sans ce champ.

Lectures des magasins : tri par nom supposé, archivés compris ; le filtre « son
centre » d'un responsable arrive avec l'étape 4.

À vérifier contre la v1 (non disponible lors du lot A1) : la forme exacte de
`MagasinDto` (reprise du `CentreDto`, plus `centreId` et `images`) et les codes
`MAGASIN_ID_EMPTY` / `MAGASIN_ID_INVALID`.

Images (lot C, ADR-0021) : dossier lu dans `UPLOADS_DIR` (`./uploads` par
défaut) ; le rendez-vous NAS ne fixe que sa valeur. `MagasinDto.images` suit le
`MagasinImageDto` de la v1 (`id`, `url`, `ordre`, `createdAt`), URL publique
`/uploads/magasins/<magasin>/<fichier>`. À confirmer avec le front : la lecture
des codes `IMAGE_TROP_VOLUMINEUSE` (413) et `IMAGE_FORMAT_NON_SUPPORTE` (400).

Concurrence sur un magasin : « le dernier qui écrit gagne », comme pour le
centre (ADR-0017, proposé).

Avant la mise en production (ADR-0008) : le script de reprise calcule aussi
`cleDoublon` pour les magasins de la v1, puis la colonne devient obligatoire.

## Étape 4 — Identité et accès

Décisions du 2026-10-02 : NAS local, accès par VPN, HTTPS (ADR-0019) ; un
compte par centre, partagé, et un seul administrateur (D-19, ADR-0020) ; pas
de libre-service de mot de passe (D-09).

| Élément                                                                                                       | État |
| ------------------------------------------------------------------------------------------------------------- | ---- |
| Lot 1 — Premier admin, connexion, sessions, rôles (RDC-ACCES-001 à 004, 006, 007, 011)                        | ⏳   |
| Lot 1 — Journal des connexions et des échecs de connexion (RDC-ACCES-008, durée provisoire 1 an)              | ⏳   |
| Lot 1 — Protéger toutes les routes du référentiel, supprimer `verifierDeploiementAutorise`                    | ⏳   |
| Lot 2 — Comptes de centre gérés par l'admin : créer, modifier, mot de passe, désactiver (RDC-ACCES-009, 010)  | ⏳   |
| Lot 3 — Événement « centre archivé » : compte du centre désactivé, sessions révoquées (RDC-ACCES-005, un ADR) | ⏳   |

Reporté à l'étape 5 : refuser de désactiver le compte d'un centre pendant une
collecte (RDC-ACCES-012), via le contrat publié par Collecte.

À décider avant la partie HTTP du lot 1 : garde-t-on le contrat
d'authentification de la v1 (routes `/api/auth/*`, cookie `path=/api/auth`) ?
Il n'est utile que si le front v1 est conservé ; si le front est refait
(étape 8), le contrat peut être conçu pour la v2, et l'ADR-0009 est revu.

Point ouvert : procédure de secours si l'unique administrateur perd son mot de
passe (ADR-0020).

Avant la mise en production : l'admin définit un nouveau mot de passe pour
chaque compte de centre ; les mots de passe de la v1 ne sont pas repris. Le
script de reprise vérifie qu'aucun centre n'a plusieurs comptes actifs et que
chaque compte a une adresse propre (ADR-0020).
