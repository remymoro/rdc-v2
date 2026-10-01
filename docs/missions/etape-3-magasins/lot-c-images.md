# Lot C — Images d'un magasin

- **Branche :** `feat/referentiel-images-magasin`
- **Prérequis :** A1 fusionné ; **lieu de stockage confirmé** après le
  rendez-vous NAS (dossier partagé du NAS servi par nginx, comme le volume
  `uploads` de la v1)

## Ordre de mission (à coller dans Codex)

```text
Tu travailles dans le dépôt rdc-v2. Lis d'abord AGENTS.md, puis
docs/missions/etape-3-magasins/00-plan.md et
docs/missions/etape-3-magasins/lot-c-images.md : ce dernier est ton ordre de
mission complet. Exécute le lot sur la branche feat/referentiel-images-magasin,
créée depuis main à jour. Travaille en TDD, un commit par cycle au format
feat(referentiel): …. Termine par `pnpm agent:gate -- --full`, puis ouvre une
pull request titrée « feat(referentiel): images d'un magasin ».
```

## Règles

- RDC-REF-007 : images ordonnées ; ajouter un identifiant déjà présent
  (`MAGASIN_IMAGE_DEJA_PRESENTE`) ou retirer une image absente
  (`MAGASIN_IMAGE_INTROUVABLE`) : 400 comme en v1.
- Correction de l'audit A-18 : nom de fichier UUID généré, extension **jamais**
  dérivée du nom envoyé, chemin toujours sous le dossier du magasin.
- **Taille maximale : 5 Mo** (5 × 1024 × 1024 octets), comme la v1
  (`../rdc/apps/api/src/presentation/http/controllers/magasin.controller.ts:24`).
  Au-delà : `IMAGE_TROP_VOLUMINEUSE`, **413**, comme le refus de taille de la v1.
- **Formats acceptés : JPEG, PNG, WebP**, comme la v1 (ligne 25), mais reconnus
  par la **signature du contenu** et non par le type annoncé par le client :
  JPEG `FF D8 FF` ; PNG `89 50 4E 47 0D 0A 1A 0A` ; WebP `RIFF` (octets 0-3)
  puis `WEBP` (octets 8-11). Tout autre contenu, même annoncé `image/jpeg` :
  `IMAGE_FORMAT_NON_SUPPORTE`, **400**. L'extension stockée (`.jpg`, `.png`,
  `.webp`) vient du format reconnu.
- Stockage derrière un port applicatif (`StockageImages`) ; adapter disque
  local en production, fake en mémoire en test.
- Contrat v1 : `POST /api/magasins/:id/images` (multipart),
  `DELETE /api/magasins/:id/images/:imageId` ; URL publique comme en v1.

## Cycles TDD

1. Domaine : `ajouterImage`, `retirerImage`, ordre.
2. Reconnaissance du format par signature : JPEG, PNG et WebP acceptés ; un
   GIF, un PDF et un texte renommé `.jpg` refusés.
3. Port de stockage, fake, adapter disque avec test d'intégration (nom généré,
   refus d'un nom de fichier forgé).
4. Use cases dans l'unité de travail ; si l'écriture en base échoue, le fichier
   écrit est supprimé.
5. HTTP et E2E : 201 ; 413 `IMAGE_TROP_VOLUMINEUSE` (fichier de 5 Mo + 1
   octet) ; 400 `IMAGE_FORMAT_NON_SUPPORTE` (PDF annoncé `image/jpeg`) ; 400
   `MAGASIN_IMAGE_INTROUVABLE` ; 404 magasin inconnu.

## Critères d'acceptation

- [ ] Un test prouve que `x./../evil` ne sort pas du dossier du magasin.
- [ ] RDC-REF-007 passe à ✅.
- [ ] `pnpm agent:gate -- --full` passe.
