# ADR-0021 — Stockage des images des magasins : dossier configurable, la base fait foi

- **Statut :** proposé
- **Date :** 2026-10-02

## Contexte

Le lot C de l'étape 3 (RDC-REF-007) attendait de connaître le dossier du NAS
où ranger les images des magasins. Ce lieu ne sera fixé qu'au rendez-vous NAS
(ADR-0019). La v1 range déjà les images dans un volume monté, dont le chemin
vient de la variable `UPLOADS_DIR`, et nginx sert ce volume sous `/uploads`.

Deux autres points demandent une décision :

- l'audit A-18 : en v1, l'extension du fichier vient du nom envoyé par le
  client, et le type est celui qu'il annonce ;
- la base et le disque n'ont pas de transaction commune : une écriture peut
  réussir d'un côté et échouer de l'autre.

## Décision

1. **Dossier configurable.** Le dossier racine des images est lu dans la
   variable d'environnement `UPLOADS_DIR`, comme la v1 (exemple de
   TENETS-COMPOSE-002). Seule la composition la lit (`ReferentielModule`,
   `main.ts`), par `dossierDesImages()`. Valeur par défaut : `./uploads`,
   résolu depuis le dossier courant, ignoré par git, pour le développement.
   Le rendez-vous NAS ne fixe que la valeur de `UPLOADS_DIR` ; aucun code ne
   change. Le lot C n'est donc plus bloqué.
2. **Arborescence et URL de la v1.** Fichier :
   `<UPLOADS_DIR>/magasins/<magasinId>/<fichier>`. URL publique :
   `/uploads/magasins/<magasinId>/<fichier>`, servie par nginx sur le NAS et
   par l'API elle-même (`useStaticAssets`) quand aucun nginx n'est devant,
   hors du préfixe `/api`. La colonne `MagasinImage.url` garde ce format v1 :
   les images et le volume de la v1 se reprennent tels quels (ADR-0008).
3. **Nom généré (audit A-18).** Le fichier se nomme `<id de l'image>.<ext>` :
   un UUID généré par `GenerateurIdentifiants`, et l'extension du format
   reconnu par la signature du contenu (JPEG `FF D8 FF`, PNG
   `89 50 4E 47 0D 0A 1A 0A`, WebP `RIFF`…`WEBP`). Le nom et le type envoyés
   par le client ne sont jamais lus. `FichierImage` refuse tout nom qui n'a
   pas la forme `UUID.extension`, et l'adapter disque vérifie en plus que le
   chemin reste sous le dossier du magasin. Taille maximale : 5 Mo, comme la
   v1 (`IMAGE_TROP_VOLUMINEUSE`, 413).
4. **La base fait foi.** Une image en base a toujours son fichier ; un fichier
   sans image en base (orphelin) est toléré puis supprimé :
   - ajout : écrire le fichier, puis enregistrer l'image et valider la
     transaction ; si la transaction échoue, supprimer le fichier ; si cette
     suppression échoue aussi, l'orphelin est journalisé ;
   - retrait : retirer l'image et valider la transaction, **puis** supprimer
     le fichier ; si la transaction échoue, le fichier n'est pas touché ; si la
     suppression du fichier échoue, la réponse reste 204 et l'orphelin est
     journalisé (port applicatif `Journal`) ;
   - nettoyage : `NettoyerImagesOrphelinesUseCase` supprime les fichiers sans
     image en base âgés d'au moins une heure (un ajout peut être en cours). Une
     tâche de l'API le lance au démarrage puis toutes les heures (le NAS est
     éteint hors saison). Il est idempotent ; un échec est journalisé et
     retenté au passage suivant. Ce qui n'a pas la forme d'un fichier d'image
     n'est jamais supprimé.

## Écarts avec la v1

| Sujet                    | v1                                                 | v2                                                     |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------ |
| Extension et type        | Nom et type annoncés par le client                 | Format reconnu par la signature du contenu             |
| Retrait d'une image      | Fichier supprimé **avant** la base                 | Base d'abord, fichier ensuite ; orphelin nettoyé       |
| Image absente au retrait | 404 `IMAGE_NOT_FOUND` (contrôle du use case)       | 400 `MAGASIN_IMAGE_INTROUVABLE`, le code du domaine v1 |
| Position d'une image     | Toujours 0 (le contrôleur ne transmet pas `ordre`) | Après la plus grande position existante (0, 1, 2…)     |
| Refus de taille          | 413 du framework, sans code métier                 | 413 `IMAGE_TROP_VOLUMINEUSE`                           |
| Format refusé            | 400 du framework (type annoncé)                    | 400 `IMAGE_FORMAT_NON_SUPPORTE` (contenu)              |
| Identifiant d'image      | Non contrôlé                                       | UUID : 400 `IMAGE_ID_INVALID` sinon                    |

## Options écartées

- **Attendre le rendez-vous NAS** : bloque le lot pour une simple valeur de
  configuration.
- **Chemin écrit dans le code** : changerait le code au déploiement.
- **Images en base (`bytea`)** : supprime l'incohérence base/disque, mais
  grossit la base et ses sauvegardes, et nginx ne pourrait plus servir les
  fichiers directement.
- **Supprimer le fichier avant la base, comme la v1** : un échec de la
  transaction laisserait une image en base sans fichier.

## Conséquences

- Déploiement sur le NAS : monter le dossier partagé dans le conteneur de
  l'API, renseigner `UPLOADS_DIR`, et faire servir le même dossier par nginx
  sous `/uploads` (comme la v1). L'utilisateur de l'API doit pouvoir y écrire.
- Un échec du disque (droits, disque plein, NAS absent) devient
  `STOCKAGE_IMAGES_INDISPONIBLE` (503).
- La tâche de nettoyage tourne dans chaque instance de l'API ; elle est
  idempotente, donc sans risque si l'API est un jour lancée deux fois.
- Le nettoyage ne supprime jamais les fichiers d'un magasin inconnu en base :
  un magasin n'est jamais supprimé, son absence signale une base vide, en
  cours de reprise ou qui n'est pas celle du dossier. Il le journalise et
  passe (revue du lot C, B1). Consigne de déploiement : reprendre la base
  avant de monter le volume v1 ; chaque base a son propre `UPLOADS_DIR`
  (les E2E utilisent `tmp/uploads-e2e`).
- Le front v1 reçoit les mêmes URL et le même `MagasinDto` ; à confirmer :
  la lecture des nouveaux codes d'erreur (413, 400) par l'écran d'envoi.
- Vérifié par : tests du domaine (signatures, `x./../evil`), suite de contrat
  `StockageImages` (fake et disque, sans PostgreSQL), tests des use cases
  (quatre ordres d'échec, nettoyage), tests de la tâche (minuteries simulées),
  E2E HTTP.
