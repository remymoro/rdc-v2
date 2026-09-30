---
paths:
  - 'libs/*/domain/**/*.ts'
---

# Agrégats et services de domaine

## TENETS-AGGREGATE-001 — Chaque agrégat a une seule racine

`core` · erreur

**Règle.** Un agrégat a exactement une racine, seul point d'entrée vers ses
entités et valeurs internes.

**Pourquoi.** Une racine unique donne une seule autorité pour la cohérence de l'ensemble.

```ts
// ❌ Incorrect
collecte.participations.push(new Participation(magasinId, centreId));

// ✅ Correct
collecte.inscrireMagasin(magasinId, centreId, maintenant);
```

**Correction.** Choisir l'entité qui possède le cycle de vie comme racine et
faire passer accès et mutations par elle.

**Vérification en revue.** Un appelant ne peut pas obtenir puis modifier un
membre de l'agrégat sans passer par la racine (les getters renvoient des copies
ou des `readonly`).

## TENETS-AGGREGATE-002 — Les frontières d'agrégat suivent les invariants transactionnels

`core` · erreur

**Règle.** Regrouper un état dans un agrégat quand ses invariants doivent être
cohérents immédiatement, dans la même transaction. Ne pas regrouper pour la
navigation ou la commodité de persistance.

**Pourquoi.** Un agrégat trop gros crée de la contention ; trop petit, il ne peut
pas imposer ses invariants.

```text
❌ Centre + tous ses Magasins + tous ses Bénévoles forment un agrégat, parce que
   l'écran les affiche ensemble.

✅ Collecte + ses Participations partagent l'invariant « pas d'inscription hors
   PREPARATION » ; le Magasin est référencé par MagasinId.
```

**Correction.** Nommer l'invariant et la transaction qui justifient la frontière,
puis séparer les concepts seulement liés.

**Vérification en revue.** Quel invariant exige que chaque membre change en même temps que la racine ?

## TENETS-AGGREGATE-003 — La racine impose les invariants internes

`core` · erreur

**Règle.** La racine valide et réalise toute opération pouvant affecter un
invariant qui couvre plusieurs membres.

**Pourquoi.** Un enfant seul ne peut pas protéger une règle qui concerne l'ensemble.

```ts
// ❌ Incorrect — contourne la règle « un magasin inscrit une seule fois »
collecte['participations'].push(participation);

// ✅ Correct
collecte.inscrireMagasin(magasinId, centreId, maintenant);
```

**Correction.** Encapsuler les collections internes et exposer un comportement de
racine qui impose tous les invariants concernés.

**Vérification en revue.** Chaque mutation d'un enfant provient d'un comportement de la racine.

## TENETS-AGGREGATE-004 — Un seul repository persiste l'agrégat complet

`core` · erreur

**Règle.** La racine a un seul contrat de repository qui persiste et reconstitue
l'agrégat complet. Les membres internes n'ont pas de repository propre.

**Pourquoi.** La persistance doit préserver la frontière de cohérence de l'agrégat.

```ts
// ❌ Incorrect
await collecteRepository.save(collecte);
await participationRepository.saveAll(collecte.participations);

// ✅ Correct
await collecteRepository.save(collecte);
```

**Correction.** Déplacer le mapping des enfants dans l'adapter de repository de
l'agrégat et supprimer les repositories d'enfants.

**Vérification en revue.** Une seule opération de repository reconstruit et persiste tout l'état de l'agrégat.

## TENETS-AGGREGATE-005 — Un agrégat en référence un autre par son identité

`core` · erreur

**Règle.** Un agrégat stocke les références vers d'autres agrégats sous forme
d'identifiants (value objects), jamais d'instances imbriquées.

**Pourquoi.** Les références par identité préservent des frontières de cohérence
séparées et évitent les mutations croisées accidentelles.

```ts
// ❌ Incorrect
class Collecte {
  private magasins: Magasin[] = [];
}

// ✅ Correct
class Collecte {
  private participations: ParticipationMagasin[] = [];
} // { magasinId, centreId }
```

**Correction.** Remplacer les agrégats imbriqués par des identifiants typés et
charger l'état requis dans le use case.

**Vérification en revue.** Aucun champ d'agrégat ne contient une entité qui a son propre repository.

## TENETS-AGGREGATE-006 — Les workflows multi-agrégats sont coordonnés hors des agrégats

`core` · erreur

**Règle.** Les use cases (ou gestionnaires d'événements) coordonnent les
workflows qui touchent plusieurs agrégats. Un agrégat ne charge ni ne modifie un autre.

**Pourquoi.** Aucun agrégat ne possède le cycle de vie ni la transaction d'un autre.

```ts
// ❌ Incorrect
collecte.demarrerEtBloquerMagasins(magasinRepository);

// ✅ Correct — dans le use case
collecte.demarrer(maintenant);
await this.collecteRepository.save(collecte);
```

**Correction.** Sortir l'enchaînement multi-agrégats vers l'extérieur et
appeler le comportement de chaque racine chargée séparément.

**Vérification en revue.** Aucune méthode d'agrégat ne reçoit un repository ou un autre agrégat à modifier.

## TENETS-AGGREGATE-007 — Les écritures concurrentes ont une stratégie de conflit explicite

`pragmatic` · erreur

**Règle.** Là où des écritures concurrentes sont possibles, définir une
stratégie explicite : version optimiste, verrou, opération commutative,
sérialisation ou réconciliation.

**Pourquoi.** Les méthodes d'agrégat protègent les invariants en mémoire, pas
contre les mises à jour perdues entre transactions concurrentes.

```ts
// ❌ Incorrect — écrase silencieusement une modification concurrente
await prisma.collecte.update({ where: { id }, data });

// ✅ Correct — version optimiste
const resultat = await tx.collecte.updateMany({
  where: { id: collecte.id.valeur, version: collecte.version - 1 },
  data: { ...donnees, version: collecte.version },
});
if (resultat.count !== 1) throw new ConflitVersionCollecte(collecte.id);
```

**Correction.** Identifier la frontière de conflit, puis implémenter et tester la
stratégie dans le contrat et l'adapter du repository.

**Vérification en revue.** Un agrégat modifiable par plusieurs acteurs (admin +
tâche cron, par exemple) ne peut pas écraser silencieusement un état validé.

## TENETS-SERVICE-001 — Un service de domaine porte un comportement sans propriétaire naturel

`pragmatic` · erreur

**Règle.** N'utiliser un service de domaine que pour un comportement métier qui
implique plusieurs concepts et n'appartient naturellement à aucune entité ni
value object.

**Pourquoi.** Des services prématurés produisent un modèle procédural ; forcer un
comportement sans propriétaire sur une entité crée un couplage artificiel.

```ts
// ❌ Incorrect — la transition appartient à Centre
export class CentreService {
  archiver(centre: Centre) {
    centre['statut'] = StatutCentre.ARCHIVE;
  }
}

// ✅ Correct — règle entre plusieurs concepts
export class DisponibiliteBenevole {
  estDisponible(benevole: Benevole, creneau: CreneauHoraire, slots: readonly Slot[]): boolean {
    /* … */
  }
}
```

**Correction.** Déplacer le comportement vers son entité ou value object naturel ;
ne garder un service que sans propriétaire unique.

**Vérification en revue.** Pour chaque méthode de service : pourquoi ce
comportement ne peut-il appartenir à un seul des objets reçus ?

## TENETS-SERVICE-002 — Un service de domaine est pur et sans état

`pragmatic` · erreur

**Règle.** Un service de domaine opère uniquement sur des données du domaine
reçues. Il ne garde pas d'état de workflow et ne fait ni persistance, ni réseau,
ni messagerie, ni lecture de configuration, ni orchestration.

**Pourquoi.** Les use cases possèdent le chargement et la coordination externe ;
les services de domaine expriment un comportement déterministe.

```ts
// ❌ Incorrect
async estDisponible(benevoleId: BenevoleId) {
  const slots = await this.slotRepository.listByBenevole(benevoleId);
}

// ✅ Correct
estDisponible(benevole: Benevole, creneau: CreneauHoraire, slots: readonly Slot[]): boolean
```

**Correction.** Déplacer les I/O et chargements dans le use case et passer les
objets du domaine au service.

**Vérification en revue.** Constructeurs et méthodes des services : aucun
repository, port, état mutable ni appel externe (et aucun `async`).
