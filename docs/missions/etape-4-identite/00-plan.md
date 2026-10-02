# Mission — Étape 4 : identité et accès

- **Ouverte le :** 2026-10-02
- **Règles :** RDC-ACCES-001 à 011 (`docs/domaine/identite-acces.md`), sauf
  RDC-ACCES-012 (reportée à l'étape 5)
- **Décisions déjà prises :** D-09 (pas de libre-service), D-19 (un compte par
  centre, un seul administrateur), ADR-0019 (NAS, VPN, HTTPS), ADR-0020
- **Exécutant et relecture :** Claude Code, une PR = une tranche ; relecture
  par sous-agents en lecture seule avant chaque push
- **Modèle à imiter :** le référentiel (`libs/referentiel/**`), étapes 1 à 3

## Objectif

Savoir qui est connecté et ce qu'il a le droit de faire : un administrateur
unique pour le siège, un compte partagé par centre. Toutes les routes du
référentiel sont protégées, et l'API peut enfin démarrer en production
(`verifierDeploiementAutorise` supprimé). Le front reçoit son premier écran :
la connexion.

## Nouveau contexte

`identite-acces` : libs `domain`, `application`, `adapters` (tags
`context:identite-acces`, `layer:*`). Il n'importe que lui-même et le
`shared-kernel`. Le centre d'un compte est une **référence locale**
(`CentreId` propre au contexte, TENETS-PORT-010) : aucun import du référentiel.

## Lots et tranches

```text
Lot 1  Se connecter
  1a  Domaine : Utilisateur, rôles, adresse de connexion, mot de passe
  1b  Application : port UtilisateurRepository (+ contrat, fake),
      hachage par un port, premier administrateur (RDC-ACCES-004, 011)
  1c  Prisma : table des utilisateurs, repository, hachage non bloquant
  1d  Sessions : domaine et application (RDC-ACCES-006), connexion,
      rafraîchissement avec rotation, déconnexion, hachage factice (A-07)
  1e  HTTP : routes d'authentification, guard de rôle unique (RDC-ACCES-003),
      périmètre « son centre » (RDC-ACCES-002), limite de débit (A-03, A-05),
      journal des connexions (RDC-ACCES-008), routes du référentiel protégées,
      suppression de verifierDeploiementAutorise
  1f  Front : écran de connexion, lib de contrat HTTP partagée (DTO)
Lot 2  Comptes de centre gérés par l'admin (RDC-ACCES-009, 010)
Lot 3  Événement « centre archivé » : compte désactivé, sessions révoquées
       (RDC-ACCES-005, un ADR)
```

| Tranche | Branche                             | Prérequis | État        |
| ------- | ----------------------------------- | --------- | ----------- |
| 1a      | `feat/identite-acces-domaine`       | —         | 🔄 en cours |
| 1b      | `feat/identite-acces-premier-admin` | 1a        | ⏳          |
| 1c      | `feat/identite-acces-prisma`        | 1b        | ⏳          |
| 1d      | `feat/identite-acces-sessions`      | 1c        | ⏳          |
| 1e      | `feat/identite-acces-http`          | 1d        | ⏳          |
| 1f      | `feat/web-connexion`                | 1e        | ⏳          |

## Hypothèses à confirmer

Retenues pour avancer ; elles ne touchent que les tranches indiquées, et
peuvent changer avant elles.

| Sujet                                                    | Hypothèse                                                                                                                                | Tranche |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| Contrat d'authentification                               | Conçu pour la v2 (le front est refait, ADR-0023) ; garde `/api/auth/*` et le cookie de rafraîchissement `path=/api/auth`. ADR-0009 revu. | 1e      |
| Secours si l'unique administrateur perd son mot de passe | Une commande lancée sur le NAS redéfinit son mot de passe et révoque ses sessions ; aucune route HTTP ; chaque usage journalisé.         | 1e      |
| Durée de conservation du journal des connexions          | 1 an (provisoire, D-06)                                                                                                                  | 1e      |
| Longueur du mot de passe                                 | 12 à 128 caractères : minimum repris de la v1, maximum ajouté (audit A-06)                                                               | 1a      |

## Ce qui ne fait pas partie de l'étape 4

- **RDC-ACCES-012** (pas de désactivation pendant une collecte) : étape 5,
  par le contrat publié de `collecte`.
- **Traçabilité des données des bénévoles** (RDC-ACCES-008, D-06) : étape 6.
