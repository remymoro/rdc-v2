---
paths:
  - 'libs/**/*.ts'
---

# Bounded contexts

Contextes de RDC v2 : `identite-acces`, `referentiel`, `benevoles`, `collecte`,
`planification`, `saisie`, `statistiques`, plus un `shared-kernel` minimal.
Chaque contexte a ses libs et son tag `context:<nom>` ; le lint interdit les
imports entre contextes (ADR-0003 R1).

## TENETS-CONTEXT-001 — Chaque contexte possède son modèle et son langage

`core` · erreur

**Règle.** Chaque bounded context possède les définitions, invariants et le
langage de son modèle. Un même mot peut avoir volontairement une structure et un
sens différents selon le contexte.

**Pourquoi.** Une propriété explicite empêche un modèle d'entreprise partagé de
coupler des capacités qui évoluent indépendamment.

```text
❌ collecte, planification et statistiques importent tous l'entité Magasin de referentiel.

✅ referentiel possède Magasin (adresse, images, statut) ;
   collecte possède ParticipationMagasin { magasinId, centreId } ;
   statistiques possède MagasinDansSynthese (nom, enseigne, poids).
```

**Correction.** Attribuer chaque concept à un contexte et traduire aux frontières
publiées au lieu de partager les modèles internes.

**Vérification en revue.** Chaque type du domaine a un seul contexte propriétaire.

## TENETS-CONTEXT-002 — Un contexte n'importe pas l'intérieur d'un autre

`core` · erreur

**Règle.** Un contexte n'importe ni les entités, ni les value objects, ni les
repositories, ni les use cases, ni les modules internes d'un autre contexte.

**Pourquoi.** Les modèles internes encodent un langage et des invariants locaux ;
les partager couple les contextes.

```ts
// ❌ Incorrect — dans libs/collecte/application
import { Magasin, MagasinRepository } from '@rdc/referentiel-domain';

// ✅ Correct — port du contexte consommateur, dans son langage
export abstract class MagasinsInscriptibles {
  abstract verifier(magasinId: MagasinId): Promise<EtatInscriptionMagasin>;
}
```

**Correction.** Remplacer l'import interne par un port du contexte consommateur
et un adapter vers un contrat publié du fournisseur.

**Vérification en revue.** Vérifié par le lint (`context:*`) ; en revue, vérifier
qu'aucun contournement (copie de code, `any`) n'a été fait.

## TENETS-CONTEXT-003 — Un contrat entre contextes utilise la langue du consommateur

`core` · erreur

**Règle.** Le contexte consommateur définit la capacité dont il a besoin, avec
son langage ubiquitaire et ses types sémantiques.

**Pourquoi.** Le consommateur dépend d'un besoin métier stable, pas du modèle de
stockage ni du vocabulaire interne du fournisseur.

```ts
// ❌ Incorrect
abstract lireLigneMagasin(pk: string): Promise<Record<string, unknown>>;

// ✅ Correct
abstract verifier(magasinId: MagasinId): Promise<EtatInscriptionMagasin>;
```

**Correction.** Renommer le contrat autour de la capacité consommatrice et
remplacer les paramètres du fournisseur par des types locaux.

**Vérification en revue.** Le contrat se comprend sans connaître le schéma ni le modèle du fournisseur.

## TENETS-CONTEXT-004 — Les adapters entre contextes traduisent des contrats publiés

`pragmatic` · erreur

**Règle.** Un adapter entre contextes appelle un contrat **publié** par le
fournisseur et traduit ses représentations dans les types du port consommateur.

**Pourquoi.** Une frontière de traduction explicite empêche qu'un modèle interne
devienne partagé par accident.

```ts
// ❌ Incorrect — l'adapter lit directement le repository de l'autre contexte
return this.magasinRepository.get(magasinId);

// ✅ Correct
async verifier(magasinId: MagasinId): Promise<EtatInscriptionMagasin> {
  const magasin = await this.referentielPublic.obtenirMagasin(magasinId.valeur);
  return magasin === null
    ? EtatInscriptionMagasin.inconnu()
    : EtatInscriptionMagasin.depuis(magasin.statut === 'ACTIF', CentreId.creer(magasin.centreId));
}
```

**Correction.** N'appeler qu'une API, un événement ou un contrat applicatif publié
et mapper la réponse vers des types du consommateur.

**Vérification en revue.** L'adapter est le seul endroit qui connaît à la fois la
donnée publiée et la sémantique du consommateur.

> **Contrat publié dans le monorepo (à mettre en place au premier besoin, par
> ADR).** Le fournisseur expose une lib `libs/<contexte>/contrat` taguée
> `scope:published` : des types et une façade en primitives, sans objet du
> domaine. Seules les libs `layer:adapters` d'autres contextes peuvent
> l'importer ; il faut donc ajouter une contrainte ESLint pour `scope:published`.

## TENETS-CONTEXT-005 — L'emplacement du port consommateur suit la propriété de la capacité

`pragmatic` · erreur

**Règle.** Un port consommateur inter-contextes va dans le **domaine** s'il
fournit une capacité utilisée directement par un comportement du domaine. Il va
dans l'**application** s'il sert l'orchestration, la validation de références
externes, le reporting ou l'enrichissement.

**Pourquoi.** L'emplacement suit le propriétaire de la capacité, pas une règle
générale « toute dépendance externe dans le domaine ».

```text
❌ libs/collecte/domain/src/ports/magasins-inscriptibles.ts   (seul un use case l'utilise)
✅ libs/collecte/application/src/ports/magasins-inscriptibles.ts
```

**Correction.** Déterminer si la capacité fait partie du comportement du domaine
ou de la coordination applicative, puis déplacer le contrat.

**Vérification en revue.** L'emplacement du port est justifié par son propriétaire ; un use case l'appelle.

## TENETS-CONTEXT-006 — Les références externes sont validées via des contrats publics

`pragmatic` · erreur

**Règle.** Quand un workflow exige qu'une référence externe soit valide, le use
case la valide via un port consommateur **avant** de persister la référence locale.

**Pourquoi.** Un repository local ne peut pas valider la propriété ni le cycle de
vie d'un autre contexte, et le domaine ne fait pas d'I/O.

```ts
// ❌ Incorrect
collecte.inscrireMagasin(commande.magasinId, commande.centreId, maintenant);

// ✅ Correct
const etat = await this.magasinsInscriptibles.verifier(commande.magasinId);
if (!etat.peutEtreInscrit) throw new MagasinNonInscriptible(commande.magasinId);
collecte.inscrireMagasin(commande.magasinId, etat.centreGestionnaire, maintenant);
```

**Correction.** Ajouter un port consommateur appelé par le use case et valider
avant la création ou la persistance locale.

**Vérification en revue.** Les références possédées par un autre contexte sont
validées à la frontière applicative quand le workflow l'exige.

## TENETS-PATTERN-004 — Adapter consommateur inter-contextes (réécrit pour NestJS)

`pragmatic` · guide

```ts
// libs/collecte/application/src/ports/magasins-inscriptibles.ts
export abstract class MagasinsInscriptibles {
  abstract verifier(magasinId: MagasinId): Promise<EtatInscriptionMagasin>;
}

// libs/collecte/adapters/src/referentiel/referentiel-magasins-inscriptibles.ts
@Injectable()
export class ReferentielMagasinsInscriptibles extends MagasinsInscriptibles {
  constructor(private readonly referentielPublic: ReferentielPublic) {
    super();
  } // contrat publié
  async verifier(magasinId: MagasinId): Promise<EtatInscriptionMagasin> {
    /* traduction */
  }
}
```

La traduction ajoute du code et des types qui se ressemblent : c'est le prix de
l'autonomie des contextes, qui peuvent ainsi évoluer indépendamment.
