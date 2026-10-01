# ADR-0009 — Contrat HTTP de création de centre, erreurs et authentification reportée

- **Statut :** accepté
- **Date :** 2026-09-30

## Contexte

`POST /api/centres` est la première route de RDC v2. Le front Angular de la v1
doit pouvoir l'utiliser sans modification. En v1, la route est réservée à
l'ADMIN, le DTO duplique des règles du domaine (`@MaxLength`, `@IsPostalCode`,
`@IsPhoneNumber`…) et les erreurs inattendues sortent au format par défaut de
NestJS. Le front n'utilise que les champs `message` et `code` des erreurs.

## Décision

1. **Contrat v1 conservé (E3)** : mêmes route, corps de requête et réponse
   (`CentreDto`, `responsablesCount: 0` à la création) ; même format d'erreur
   `{ statusCode, error, message, code, path, timestamp }`, défini une seule fois
   (`envoyerErreur`) ; mêmes statuts : validation métier 400, doublon 409,
   requête mal formée 400 `REQUEST_VALIDATION`, 401/403/404 avec les codes v1.
2. **DTO de forme uniquement (E2)** : présence et type des champs ; les règles
   métier ne sont vérifiées que par les value objects (TENETS-VALIDATE-002). Une
   requête qui viole une règle métier reçoit donc le code précis du domaine
   (`NOM_TOO_LONG`…) au lieu de `REQUEST_VALIDATION`. Sans effet sur le front,
   qui affiche `message`.
3. **Erreurs inattendues** : 500 `INTERNAL_ERROR`, message générique, trace
   journalisée une seule fois (TENETS-ERROR-007). Nouveau par rapport à la v1.
4. **Authentification reportée (E1)** : la route n'est **pas protégée** tant que
   le contexte identité-accès (étape 4) n'existe pas.
5. **Tests E2E** en boîte noire (`apps/api-e2e`) sur la base `rdc_test` :
   `pnpm e2e` en local, étape `nx affected -t e2e` en CI.

### Complément du 2026-10-01 — cycle de vie d'un centre (étape 2)

Même décision (contrat v1 conservé) appliquée aux trois routes de la v1 ; pas
de nouvel ADR, aucune option nouvelle n'est tranchée :

- `PATCH /api/centres/:id/desactiver`, `PATCH /api/centres/:id/activer`,
  `PATCH /api/centres/:id/archiver` ; corps ignoré (le front envoie `{}`) ;
  succès **204 sans corps**.
- `:id` validé par le value object `CentreId` dans l'adapter (pas de
  `ParseUUIDPipe`, comme en v1) : id vide ou mal formé → 400 `CENTRE_ID_EMPTY`
  ou `CENTRE_ID_INVALID`.
- Centre inconnu → 404 `CENTRE_NOT_FOUND` « Le centre demandé est introuvable. »
- Activer ou désactiver un centre archivé → 409 `CENTRE_ARCHIVED`.
- Désactiver un centre inactif, activer un centre actif ou archiver un centre
  archivé est sans effet → 204.
- Mêmes réserves : routes non protégées jusqu'à l'étape 4 (réservées à l'ADMIN
  en v1).

## Conséquences

- ⚠️ **Aucun déploiement de la v2 avant l'étape 4** : les routes de création
  et de cycle de vie doivent être réservées à l'ADMIN, avec un test « refusé »
  (ADR-0003, R11).
- Règle appliquée par le code : `verifierDeploiementAutorise` (`apps/api/src/securite`)
  fait échouer le démarrage de l'API quand `NODE_ENV=production`. L'étape 4 le
  supprime en même temps qu'elle ajoute le contrôle ADMIN.
- Les codes des erreurs de validation métier diffèrent de la v1 à la création
  (plus précis) ; à revérifier si un écran du front se met à lire `code`.
- Les tests E2E refusent de s'exécuter sur une autre base que `rdc_test`.
