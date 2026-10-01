# ADR-0015 — Concurrence optimiste pour collecte et vérification

- **Statut :** proposé
- **Date :** 2026-10-01

## Contexte

Les quatorze responsables de centre peuvent saisir leurs listes en parallèle.
Un même centre peut avoir plusieurs responsables, tandis que l'administrateur
peut renvoyer ou inscrire une liste et qu'une tâche peut démarrer la collecte.
Une écriture complète sans contrôle peut perdre une réponse ou enregistrer une
modification après le gel de la vérification.

ADR-0013 accepte le dernier qui écrit gagne pour `Centre` parce qu'un seul
administrateur réalise ses transitions. Cette justification ne s'applique pas
à la vérification. TENETS-AGGREGATE-007 exige une stratégie explicite.

## Décision proposée

1. `Collecte` et `ListeVerification` ont une colonne `version Int @default(0)`.
2. Leur repository met à jour par identifiant et version lue, puis incrémente
   la version. Si aucune ligne n'est modifiée, il lève respectivement
   `COLLECTE_CONCURRENT_UPDATE` ou `LISTE_VERIFICATION_CONCURRENT_UPDATE`.
3. Ces erreurs sont stables et traduites en HTTP 409. Le client recharge la
   ressource ; aucune fusion automatique de commentaires ou de réponses n'est
   tentée.
4. Ouvrir, fermer et démarrer persistent la collecte et toutes les listes
   concernées dans une seule Unit of Work. Fermer et démarrer appellent
   `ListeVerification.figer` avant le commit.
5. L'inscription en lot sauvegarde la version de la liste transmise qu'elle a
   lue, même si elle ne modifie pas son état métier, et la collecte qui reçoit
   les participations. Toute la commande réussit ou est annulée.
6. Les suites de contrat des repositories couvrent deux sauvegardes depuis la
   même version, et les tests d'intégration couvrent réponse contre gel et
   inscription contre renvoi.

## Options écartées

- **Dernier qui écrit gagne :** peut perdre une réponse et contredit le nombre
  réel d'acteurs ; ADR-0013 reste strictement limité à `Centre`.
- **Verrou pessimiste :** sérialise inutilement les centres et nécessite du SQL
  brut pour `SELECT ... FOR UPDATE` avec Prisma.
- **Transaction sérialisable globale :** élargit le contrat de la Unit of Work,
  impose une politique de rejeu et augmente les conflits entre listes pourtant
  indépendantes.

## Conséquences

- Les centres distincts n'entrent pas en conflit : chaque liste est une racine.
- Deux modifications concurrentes d'une même liste sont détectées, jamais
  écrasées silencieusement.
- Le gel d'une douzaine de listes reste une seule transaction courte. Si une
  version a changé, l'admin relance la fermeture ou le démarrage après lecture
  du nouvel état.
- La migration est additive et compatible avec les données v1 : les versions
  existantes commencent à zéro.
- `SaisieCentre` pourra adopter la même stratégie si ses futurs tests montrent
  plusieurs auteurs concurrents ; ce lot ne modifie pas son schéma v1.
