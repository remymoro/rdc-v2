# ADR-0013 — Concurrence sur Centre : le dernier qui écrit gagne

- **Statut :** accepté
- **Date :** 2026-10-01

## Contexte

Les use cases de cycle de vie (désactiver, activer, archiver) relisent le centre
par `CentreRepository.get()` **sans verrou**, appliquent la méthode de
l'agrégat, puis `PrismaCentreRepository.save()` fait un `upsert` **complet** de
la ligne, dans une transaction en `READ COMMITTED` (niveau par défaut de
PostgreSQL).

Deux requêtes simultanées peuvent donc se croiser :

1. T1 lit le centre `ACTIF`, l'archive ;
2. T2 lit le même centre `ACTIF` (avant le `commit` de T1), l'active (sans
   effet en mémoire) ;
3. T1 enregistre `ARCHIVE` et valide ;
4. T2 enregistre `ACTIF` et valide : le centre archivé redevient `ACTIF`,
   alors que l'archivage est définitif (étape 2).

Les méthodes de `Centre` protègent les invariants en mémoire, pas entre deux
transactions. TENETS-AGGREGATE-007 exige une stratégie de conflit explicite là
où des écritures concurrentes sont possibles.

## Décision

1. **On accepte « le dernier qui écrit gagne »** pour `Centre`, comme en RDC v1.
   Décision de l'utilisateur : ces opérations ne sont faites que par **un seul
   administrateur** ; deux écritures concurrentes sur le même centre sont
   improbables et se corrigent à la main. Le risque est jugé négligeable.
2. Aucun verrou, aucune colonne de version : `get()` et `save()` restent
   inchangés. Les écritures idempotentes (désactiver un centre déjà inactif…)
   font quand même `save()` puis `commit()` ; elles réécrivent la ligne telle
   qu'elles l'ont lue et peuvent donc, elles aussi, écraser une écriture
   concurrente (cas de T2 ci-dessus).

Options écartées :

- **Verrou pessimiste** (`SELECT … FOR UPDATE` dans `get()`, via `$queryRaw`
  car Prisma ne l'expose pas) : sérialise les écritures sur un centre, mais
  ajoute du SQL brut au repository et un verrou à chaque lecture, y compris
  hors écriture ; coût inutile pour un seul administrateur.
- **Version optimiste sur `updatedAt`** (`updateMany where updatedAt = lu`,
  conflit si 0 ligne) : pas de nouvelle colonne, mais demande une erreur de
  conflit déclarée par le port, sa traduction HTTP (409), un test dans la suite
  de contrat, et `modifieLe` n'est pas modifié par les opérations idempotentes,
  qu'il faudrait alors traiter à part.
- **Transaction `Serializable`** : protège sans changer le repository, mais
  impose de rejouer les transactions en échec de sérialisation (erreur
  `40001`) et s'applique à toute l'unité de travail partagée
  (`PrismaUnitOfWork`), donc à tous les contextes.

## Conséquences

- Le scénario ci-dessus reste possible ; il n'est ni détecté ni testé.
- **À revoir** dès qu'un second rôle peut modifier un centre (étape 4,
  responsables de centre) ou s'il y a plusieurs administrateurs. Option
  privilégiée alors : **verrou dans `get()`** pour les use cases d'écriture, ou
  **version optimiste** (colonne `version` ou `updatedAt`) vérifiée par
  `save()` ; dans les deux cas, la stratégie entre dans la suite de contrat de
  `CentreRepository` (TENETS-AGGREGATE-007, TEST-003). Un nouvel ADR remplacera
  celui-ci.
- Une revue qui cite TENETS-AGGREGATE-007 sur `Centre` renvoie à cet ADR.
