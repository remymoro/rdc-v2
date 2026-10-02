# ADR-0022 — Durcissement du stockage et de la publication des images

- **Statut :** proposé
- **Date :** 2026-10-02
- **Complète :** ADR-0021, revue du lot C I1 à I7

## Décision

1. **Transaction courte (I1).** L'ajout charge le magasin et exerce le contrôle
   du domaine sur cet aperçu avant d'écrire le fichier, hors transaction.
   Une seule unité de travail relit ensuite le magasin sous le verrou existant,
   ajoute l'image sur cet état récent, enregistre et valide. Un archivage ou
   ajout concurrent pendant l'écriture disque est donc pris en compte.
   L'aperçu n'est jamais enregistré (TENETS-APP-006, UOW-007, RDC-REF-002/007).

2. **Publication atomique sans écrasement (I2, I6).** L'adapter écrit
   `<fichier>.<UUID-temporaire>.tmp` dans le même dossier, puis crée le nom
   public par un lien physique atomique (`link`) avant d'effacer le nom
   temporaire. Un `rename` standard écraserait une cible concurrente.
   Les lecteurs ne voient donc que des fichiers complets. Le port refuse
   toute collision par `FichierImageDejaExistant`, identique dans le fake et
   sur disque, avec HTTP 503 `IMAGE_FICHIER_DEJA_EXISTANT` : le nom vient du
   serveur, le client ne peut pas résoudre le conflit (TENETS-TEST-003,
   ERROR-004/006).

   Les échecs nettoient le temporaire sans masquer la panne initiale.
   Un échec de nettoyage est journalisé via le port `Journal`, injecté dans
   l'adapter (SIMP-3). `lister()` est une lecture sans suppression (IMP-1,
   TENETS-PORT-011). Le use case appelle `purgerTemporaires(avant)` avec la
   même limite que les orphelins, calculée par `Clock` : une heure. La purge
   ne touche que les noms temporaires privés générés par l'adapter. Son échec
   est journalisé et incrémente `echecs`, sans empêcher le nettoyage des
   images ; une purge partielle est retentée au passage suivant.
   Les temporaires ne sont jamais considérés comme des images du domaine.
   La publication précède la transaction, conformément à la demande de
   correction : pas de fenêtre « base validée, fichier pas encore publié ».

3. **Multipart borné (I3).** Multer reçoit `fileSize: 5 Mo`, `files: 1`,
   `fields: 0`, `parts: 1` et `headerPairs: 100`. Tests HTTP avec un fichier
   autorisé, des champs texte avant/après et deux fichiers.
   Limite de la dépendance installée : Busboy 1.6 utilise ses plafonds internes
   de 16 Kio et 2 000 paires d'en-têtes, sans exploiter `headerPairs`.
   La mémoire des champs reste bornée par `fields: 0` et `parts: 1` ;
   le plafond de 100 paires ne constitue donc pas une garantie effective.

4. **Publication restreinte (I4).** Dans tous les environnements, l'API sert
   uniquement `/uploads/magasins/<UUID>/<UUID>.(jpg|jpeg|png|webp)`, sans
   index ni redirection, avec `X-Content-Type-Options: nosniff` et
   `Content-Security-Policy: default-src 'none'; sandbox`.
   Les autres fichiers du volume et les temporaires sont inaccessibles.
   nginx doit appliquer la même politique ; voir
   [configuration du NAS](../exploitation/images.md).

5. **Reprise et nettoyage (I5).** Un chargement de magasin en échec conserve
   ses fichiers, incrémente `echecs` une fois pour ce magasin et journalise
   la cause avant de poursuivre. Le contrôle des noms et URL v1 est un
   préalable bloquant de la reprise, via
   [le script et sa procédure](../exploitation/images.md#reprise-v1--contrôle-bloquant-avant-la-mise-en-production).
   IMP-3 : tout code de sortie 1 ou 2 interdit la bascule en production.
   Corriger manuellement les fichiers et les URL sur une copie sauvegardée,
   réexporter les références puis obtenir un contrôle à 0 et conserver son
   rapport avant import définitif et démarrage. Le script détecte les erreurs,
   il ne les répare pas. Cette obligation complète la reprise ADR-0008.
   Il ne relâche pas les invariants du domaine (TENETS-VALIDATE-001,
   RDC-REF-007).

6. **Pannes NAS (I7).** Les codes d'absence pendant l'écriture, de partage
   déconnecté, de handle périmé, de ressources épuisées et de publication
   non supportée deviennent `StockageImagesIndisponible` avec leur cause.
   Un fichier disparu entre `readdir` et `stat` est ignoré ; les autres
   pannes restent visibles. Supprimer un fichier absent reste idempotent
   (TENETS-ADAPTER-006, ERROR-005).

## Limites et alternatives

- Le système de fichiers du NAS doit supporter les liens physiques dans le
  dossier des images. Un partage qui les refuse répond 503 ; aucune copie
  non atomique n'est utilisée en secours. Vérifier cette capacité lors du
  rendez-vous NAS. Cette atomicité de visibilité ne promet pas une durabilité
  après coupure électrique (`fsync` n'est pas ajouté).
- Une interruption brutale peut laisser un temporaire privé, récupéré au
  prochain passage de nettoyage. Un accès disque de plus d'une heure dépasse
  la marge de protection existante et n'est pas couvert.
- R1 de la revue initiale reste distinct : un COMMIT réussi mais dont
  l'acquittement est perdu peut déclencher la compensation existante.
  Le simple déplacement de l'écriture hors transaction ne résout pas cette
  incertitude. Publier après commit déplacerait le problème vers un échec
  disque après validation de la base ; cela n'est pas retenu ici.
