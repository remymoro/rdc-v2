# Revue du lot C : images d'un magasin (2026-10-02)

Branche `feat/referentiel-images-magasin`, `git diff main..HEAD` : 9 commits,
74 fichiers. Trois relecteurs en lecture seule, en parallèle :

- architecture (règles `TENETS-…`) ;
- métier, comparé à la v1 (`../rdc`) ;
- sécurité et robustesse du téléversement.

Les constats bloquants et importants ont été revérifiés dans le code avant
d'être retenus. `pnpm agent:gate` passe ; intégration et E2E non lancés en
local (pas de Docker sous WSL), la CI fait foi.

**Verdict : à corriger avant fusion (B1, B2), le reste peut suivre.**

## Bloquant

### B1 — Le nettoyage efface toutes les images d'un magasin absent de la base

RDC-REF-007 · ADR-0021 §4 · TENETS-ERROR-007

- `libs/referentiel/application/src/magasin/nettoyer-images-orphelines.use-case.ts:46-49`
  : `magasin?.images … ?? []`. Un magasin introuvable n'a aucune référence, donc
  tous ses fichiers de plus d'une heure sont supprimés.
- La tâche tourne dès le démarrage
  (`libs/referentiel/adapters/src/taches/nettoyage-images-orphelines.tache.ts`).
- Vérifié : `pnpm e2e` pointe sur `rdc_test` sans `UPLOADS_DIR`. L'API de test
  partage `./uploads` avec le développement et supprime les images de dev.
- Plausible en production : première mise en route sur le NAS avec le volume
  v1 monté avant la reprise de la base (ADR-0008). Toutes les photos v1 sont
  perdues, sans retour possible. La v1 ne supprime jamais de fichier
  automatiquement.

**Correction.**

1. Magasin introuvable : journaliser et ne rien supprimer.
2. Tâche activée par une variable explicite.
3. Donner aux E2E leur propre `UPLOADS_DIR`.
4. Consigne de déploiement dans ADR-0021 : reprendre la base avant de monter
   le volume.

Test rouge attendu : « un magasin absent de la base garde ses fichiers ».

### B2 — Deux écritures simultanées sur un magasin perdent une image

TENETS-AGGREGATE-007 · TENETS-REPO-007 · ADR-0017 · ADR-0021 §4

`libs/referentiel/adapters/src/prisma/prisma-magasin.repository.ts:55-65`.
`save()` fait `deleteMany({ id: { notIn: images de l'instantané } })` puis
`createMany(skipDuplicates)`, après un `get()` sans verrou, en READ COMMITTED.

- **Deux ajouts en parallèle** (envoi de plusieurs photos par le front) : A et
  B lisent [X]. A valide [X, A]. Le `deleteMany` de B voit A, validé, et
  l'efface. A a reçu 201, mais son image disparaît, puis son fichier est
  supprimé par le nettoyage. A et B ont aussi la même position.
- **Ajout et retrait simultanés** : le `createMany` de l'ajout recrée la ligne
  retirée, dont le fichier a déjà été supprimé. On obtient une image en base
  sans fichier, ce que l'ADR-0021 interdit.

Ce n'est pas « le dernier qui écrit gagne » (ADR-0017), c'est une perte
silencieuse.

**Correction**, au choix :

- `SELECT … FOR UPDATE` sur `Magasin` dans `get()` pendant une unité de
  travail ;
- une version optimiste (409) ;
- ne supprimer que les images retirées explicitement par l'agrégat.

Il faut aussi un test d'intégration « deux ajouts concurrents », et l'ADR-0021
complété.

## Important

### I1 — Écriture disque dans la transaction Prisma (délai par défaut de 5 s)

TENETS-UOW-007 · TENETS-APP-006

- `ajouter-image-magasin.use-case.ts:36-52` écrit jusqu'à 5 Mo sur le NAS
  dans `unitOfWork.run()`.
- `prisma-unit-of-work.ts:36` ne passe pas de `timeout`.

Sur un partage lent, la transaction expire et l'utilisateur reçoit une 500, et
non la 503 prévue. Une connexion du pool reste aussi occupée pendant
l'écriture.

**Correction.** Écrire un fichier temporaire avant `run()`, puis une
transaction courte, puis `rename` après le commit. Cela règle aussi I2 et le
commit au résultat incertain (R1).

### I2 — Écriture non atomique

`disque-stockage-images.ts:79` : `writeFile(chemin final, { flag: 'wx' })`.

- Sur ENOSPC ou EIO en cours d'écriture, le fichier tronqué reste sur le
  disque, sans compensation (`fichierEcrit` est encore `null`).
- nginx peut servir un fichier partiel.

**Correction.** Écrire `<uuid>.<ext>.tmp`, puis `rename`. Supprimer le
temporaire en cas d'échec ; le nettoyage doit aussi connaître les `.tmp`
anciens.

### I3 — Limites multer incomplètes

`magasins.controller.ts:159-163` : seulement `fileSize` et `files: 1`. La
taille du fichier est bien coupée en flux (413 correct).

Mais `fields`, `parts` et `fieldSize` gardent les valeurs par défaut de
busboy (illimité, 1 Mo par champ). Une requête avec des milliers de champs
texte remplit la mémoire, et l'API n'a pas encore d'authentification.

**Correction.**
`limits: { fileSize, files: 1, fields: 0, parts: 1, headerPairs: 100 }`.
`new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)` évite aussi une
copie de 5 Mo (`images-magasin.requete.ts:28`).

### I4 — Service statique : tout `UPLOADS_DIR`, sans en-têtes de protection

`apps/api/src/main.ts:24-28`.

- Le service est actif quel que soit `NODE_ENV`, alors que le commentaire dit
  « en développement ».
- Il couvre toute la racine, sans `X-Content-Type-Options: nosniff` ni CSP.
- `FichierImage` accepte toute extension `[a-z0-9]{1,10}` pour relire la v1,
  et la v1 tirait l'extension du nom envoyé (audit A-18). Un `.svg` ou `.html`
  repris serait servi tel quel sur l'origine de l'API : XSS stocké, grave dès
  l'étape 4 (cookie de session).

**Correction.**

- Limiter le service à `/uploads/magasins` et aux extensions jpg, jpeg, png et
  webp.
- `setHeaders` : `nosniff`, `Content-Security-Policy: default-src 'none';
sandbox`, `Cache-Control: public, max-age=31536000, immutable`.
- Mêmes règles dans nginx.

### I5 — Une seule ligne invalide bloque le nettoyage et le magasin

TENETS-VALIDATE-001 · RDC-REF-007 · ADR-0008

- `nettoyer-images-orphelines.use-case.ts:46` : `get()` n'est pas protégé par
  magasin. Un `MagasinPersisteInvalide` arrête tout le passage, à chaque heure.
- Le même nom v1 non conforme (`uuid.Capture d'écran`, `photo.jpg_large`, que
  la v1 produit avec `originalName.split('.').pop()`) fait échouer en 500
  toutes les écritures du magasin. L'image ne peut même pas être retirée pour
  le débloquer.

**Correction.**

- Un `try` par magasin dans le nettoyage (journaliser, `echecs += 1`).
- Avant la reprise, lancer sur la base v1 :
  `SELECT id, url FROM "MagasinImage" WHERE url !~* '/[0-9a-f-]{36}\.[a-z0-9]{1,10}$';`
  puis renommer les noms non conformes dans le script de reprise.

### I6 — Fichier déjà présent : le disque et le fake ne se comportent pas pareil

TENETS-TEST-003 · TENETS-ERROR-005

Le disque refuse l'écrasement (`wx`) et `EEXIST` remonte en 500 ; le fake
(`stockage-images-en-memoire.test-utils.ts:37`) écrase en silence.

**Correction.** Fixer le contrat dans `ports/stockage-images.ts` et le tester
dans `stockage-images.contrat.test-utils.ts`.

### I7 — Codes d'erreur disque incomplets

TENETS-ERROR-005 · TENETS-ADAPTER-006

- `disque-stockage-images.ts:44-54` : ENOENT, ESTALE, ENOTCONN, EHOSTDOWN,
  EMFILE et EEXIST ne sont pas traduits, ce qui donne une 500 au lieu d'une 503.
- `lister()` (l.107) : un `stat` qui renvoie ENOENT, parce que le fichier a
  été retiré pendant l'inventaire, fait échouer tout le passage.

**Correction.** Élargir la liste des codes traduits et ignorer ENOENT dans
`lister()`.

## Mineur

- **M1** — `mkdir({ recursive: true })` recrée la racine. Si le partage n'est
  pas monté, les images vont sur le disque local et sont perdues au
  redémarrage. Vérifier au démarrage que la racine existe et est inscriptible.
- **M2** — `Magasin.reconstituer()` accepte deux images de même `id`
  (`magasin.ts:136-147`, TENETS-VALIDATE-001).
- **M3** — `ImageMagasin.creer()` est exporté par l'index du domaine alors
  qu'il est réservé à l'agrégat (TENETS-AGGREGATE-003).
- **M4** — `ContenuImage.octets` garde la référence de l'appelant : à copier
  (TENETS-VALUE-001).
- **M5** — L'URL publique `/uploads/magasins/…` est construite à deux endroits
  (`magasin.mapper.ts:53`, `magasin.reponse.ts:95`).
- **M6** — Le glossaire classe « téléverser » parmi les termes à éviter, mais
  `TeleversementImageFilter` et `FichierTeleverse` l'utilisent
  (TENETS-NAME-001). Il faut renommer, ou préciser que l'interdit ne vise que
  le domaine.
- **M7** — `journal-nest.ts:21` ne garde que `cause.message` ; ajouter
  `cause.code` (TENETS-UOW-010).
- **M8** — `lot-c-images.md:27` dit « 400 comme en v1 » : la v1 répond 404
  `IMAGE_NOT_FOUND`. L'écart lui-même est documenté (ADR-0021).
- **M9** — L'ADR-0021 dit que la v1 se fie au type annoncé. En réalité, le
  `FileTypeValidator` v1 lit la signature (`file-type`) ; seule l'extension
  vient du nom envoyé.
- **M10** — Une image de 5 Mo exactement est refusée par la v1
  (`size < max`), acceptée par la v2. Sans impact, à noter dans les écarts.
- **M11** — Le complément d'ADR-0009 ne liste pas les routes d'images ni les
  codes 413, 503 et `IMAGE_ID_INVALID`.
- **M12** — Le refus sur un magasin archivé n'est testé que dans le domaine.
  Il manque un test du use case (aucun fichier écrit ni supprimé) et une E2E
  409 `MAGASIN_ARCHIVED`.
- **M13** — Pas de plafond d'images par magasin ni de limite de débit. La v1
  n'en a pas non plus ; à revoir avec l'authentification.

## Remarques

- **R1** — Commit au résultat incertain : si la connexion tombe après un
  COMMIT réussi, la compensation supprime le fichier d'une image enregistrée.
  Ce cas disparaît avec I1 (rename après commit).
- **R2** — `Journal.avertir(message, details: Record<string, string>)` prend
  des chaînes brutes (TENETS-PORT-007). C'est défendable pour un port
  d'observabilité, mais aucun ADR ne le dit.
- **R3** — Le polyglotte JPEG/HTML est accepté par la signature, et l'EXIF (y
  compris le GPS) est conservé. Le risque est faible avec `nosniff` (I4).
  Réencoder l'image (sharp) reste optionnel.

## Conforme (vérifié)

- **Contrat HTTP v1.**
  - `POST /api/magasins/:id/images` → 201 et
    `DELETE /api/magasins/:id/images/:imageId` → 204.
  - Champ multipart `file`.
  - Réponse `{ id, url, ordre, createdAt }`.
  - URL `/uploads/magasins/<magasinId>/<fichier>`.
  - Schéma `MagasinImage` inchangé, aucune migration nécessaire.
- **Limites.** 5 Mo, refusé en 413. Formats JPEG, PNG et WebP. Un magasin
  inactif accepte les images, un magasin archivé les refuse.
- **Faille A-18 corrigée.** Nom UUID généré, extension tirée de la signature ;
  `originalname` et `mimetype` ne sont jamais lus ; chemin borné au dossier du
  magasin.
- **Défauts v1 corrigés.** Le refus sur un magasin archivé a lieu avant toute
  écriture disque, alors que la v1 écrivait le fichier puis refusait, ou
  supprimait le fichier puis refusait.
- **Couches.** Aucun import NestJS, Prisma, Express ou `node:*` dans le
  domaine ni l'application ; aucun `new Date()` ni `Date.now()` ; `Clock` et
  `GenerateurIdentifiants` sont injectés (TENETS-DEPEND-001/002).
- **Port `StockageImages`.** `abstract class` avec des types sémantiques ;
  erreur déclarée dans le port (TENETS-PORT-002/007, ERROR-004).
- **Controller.** Un use case par route ; statuts choisis par les filtres
  (TENETS-ADAPTER-001, ERROR-006).
- **Unité de travail.** `run()` et `commit()` explicites. Le retrait valide la
  base puis supprime le fichier. La compensation de l'ajout est testée sur ses
  quatre ordres d'échec (TENETS-UOW-003/010).
- **Contrats.** Les suites `StockageImages` et `MagasinRepository` sont passées
  par le fake et par l'adapter réel (TENETS-TEST-003).
- **Tâche de nettoyage.** Adapter primaire, une portée neuve par passage, pas
  de chevauchement, minuterie `unref()`, marge d'une heure sur l'horloge
  injectée.

## Questions pour l'utilisateur

1. **Nettoyage au premier démarrage sur le NAS.** La v1 a laissé des orphelins
   (ajout refusé sur magasin archivé). Faut-il les supprimer automatiquement,
   ou faire d'abord un passage qui se contente de les constater ?
2. **Reprise des URL v1.** Lancer la requête d'I5 sur la base v1. Y a-t-il
   des URL Azure absolues, et leurs fichiers sont-ils dans le volume
   `uploads_prod_data` ?
3. **nginx du NAS.** Reprendre `client_max_body_size 6m` de la v1 : sinon,
   nginx renvoie 413 au-delà de 1 Mo, avant même l'API. Volume inscriptible
   par l'API ?
