# ADR-0020 — Un compte par centre et un seul administrateur

- **Statut :** accepté
- **Date :** 2026-10-02

## Contexte

En v1, rien ne limite le nombre de responsables d'un centre : la création
refuse seulement un email déjà pris ou un centre archivé, et le `CentreDto`
expose un compteur `responsablesCount`. En pratique, les comptes utilisent déjà
l'adresse email du centre. Un seul ADMIN existe, car seule la route
`bootstrap-admin` en crée un.

L'association veut éviter toute gestion de comptes personnels : l'équipe qui
gère un centre change souvent, et chaque départ ou arrivée ne doit pas créer de
travail sur les comptes. Le client a tranché (D-19).

## Décision

1. Un `RESPONSABLE_CENTRE` est **le compte du centre**, pas une personne.
   L'équipe qui gère le centre le partage. Il n'a aucun lien avec un bénévole
   (contexte `benevoles`), qui n'est jamais un utilisateur de l'application.
2. Un centre a **au plus un compte actif** (RDC-ACCES-010). Créer ou réactiver
   un compte pour un centre qui en a déjà un actif est un conflit (409).
3. Le compte se connecte avec **une adresse email qui lui est propre**, choisie
   par l'admin (celle du centre ou une adresse créée pour la collecte), unique.
   Elle n'est pas liée à l'email de contact du centre dans `referentiel`.
4. L'admin **définit le mot de passe** et le change à chaque départ ; le centre
   ne le change jamais lui-même (RDC-ACCES-009, D-09).
5. Il existe **un seul ADMIN** (RDC-ACCES-011). Aucune route ne crée un second
   ADMIN ni ne promeut un compte de centre.
6. Le `CentreDto` garde `responsablesCount` pour le front v1 (ADR-0009) ; il
   vaut désormais 0 ou 1.

## Options écartées

- **Un compte par personne** : gestion lourde avec les changements
  d'équipe, et mots de passe oubliés à traiter par le siège.
- **Identifiant de connexion = email de contact du centre, lié en direct** :
  modifier une coordonnée du référentiel changerait l'identifiant de connexion
  sans que l'admin le veuille, et couplerait les deux contextes.

## Conséquences

- **Traçabilité par centre, pas par personne** : le journal d'accès
  (RDC-ACCES-008) dira « le compte de Fumel », jamais qui l'utilisait. Choix
  assumé.
- **Reprise des données v1** : vérifier avant la mise en production qu'aucun
  centre n'a plusieurs comptes actifs, et donner une adresse propre aux trois
  centres dont l'email de contact est celui du siège (Boé Guignard, Boé Roses,
  Eric MORIVAL). À vérifier aussi : l'adresse de Sainte-Livrade, en
  `restosducœur.org` (avec « œ ») dans les données v1.
- La règle 2 est vérifiée par le use case dans l'unité de travail, avec une
  contrainte unique en base comme filet pour deux créations simultanées.
- **Point ouvert** : un seul administrateur est aussi un point de blocage. S'il
  perd son mot de passe ou quitte l'association, personne ne peut le
  remplacer depuis l'application. Une procédure de secours (script exécuté sur
  le NAS, qui exige un accès à la machine) est à décider avec l'étape 4.
