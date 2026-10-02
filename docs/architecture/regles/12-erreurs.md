---
paths:
  - 'libs/**/*.ts'
  - 'apps/api/src/**/*.ts'
---

# Erreurs

Chaque erreur est définie par la couche qui lui donne son sens ; seul l'adapter
HTTP choisit le code de statut. **Pas de hiérarchie globale** `DomainException`
/ `DomainNotFoundException` comme dans RDC v1.

**Format de réponse HTTP (convention RDC v2, compatible avec le front v1) :**

```json
{ "statusCode": 409, "code": "CENTRE_ARCHIVED", "message": "…", "path": "/api/centres/…", "timestamp": "…" }
```

Chaque erreur connue porte un `code` stable, en majuscules (`CENTRE_ARCHIVED`),
qui ne change jamais une fois publié. Quand l'erreur existait dans RDC v1, on
reprend **exactement** son code : le front Angular les utilise déjà.

**Emplacement des fichiers d'erreur (convention RDC v2, option C) :**

| Propriétaire            | Où vivent ses erreurs                                  | Exemple                                                   |
| ----------------------- | ------------------------------------------------------ | --------------------------------------------------------- |
| Value object            | Dans **le fichier du value object**                    | `commun/nom.ts` : `Nom`, `NomVide`, `NomTropLong`         |
| Agrégat ou entité       | Dans un fichier **`<concept>.errors.ts`** à côté       | `centre/centre.errors.ts` : `CentreArchive`               |
| Application (workflows) | Dans **`errors.ts`** à la racine de la lib application | `application/src/errors.ts` : `CentreDejaExistant`        |
| Port secondaire         | Dans **le fichier du port**                            | `ports/stockage-images.ts` : `StockageImagesIndisponible` |

Chaque erreur porte un `code` stable et un `name` égal au nom de sa classe.

## TENETS-ERROR-001 — La propriété d'une erreur suit son sens architectural

`core` · erreur

**Règle.** Définir une erreur à côté du concept du domaine, du workflow applicatif
ou du contrat de port qui lui donne son sens.

**Pourquoi.** Une propriété explicite garde les erreurs précises et évite qu'une
hiérarchie technique globale couple les couches et les contextes.

```text
❌ libs/shared/src/exceptions/domain.exception.ts   (toutes les erreurs du projet)

✅ libs/referentiel/domain/src/centre/centre.errors.ts           CentreArchive
   libs/referentiel/application/src/errors.ts                    CentreIntrouvable
   libs/referentiel/application/src/ports/stockage-images.ts     StockageImagesIndisponible
```

**Correction.** Déplacer chaque erreur vers son propriétaire et supprimer les catégories techniques globales.

**Vérification en revue.** Pour chaque erreur : qui peut en définir le sens sans importer une technologie extérieure ?

## TENETS-ERROR-002 — Les erreurs du domaine sont indépendantes de la technologie

`core` · erreur

**Règle.** Une erreur du domaine exprime une violation d'invariant ou de règle
métier, sans concept de framework, protocole, persistance ou fournisseur.

**Pourquoi.** Elle doit avoir le même sens via HTTP, cron, test ou script.

```ts
// ❌ Incorrect
throw new ConflictException('Centre archivé'); // @nestjs/common dans le domaine

// ✅ Correct
export class CentreArchive extends Error {
  readonly code = 'CENTRE_ARCHIVED';
  constructor(readonly centreId: CentreId) {
    super(`Le centre ${centreId.valeur} est archivé`);
    this.name = 'CentreArchive';
  }
}
```

**Correction.** Remplacer les exceptions des couches externes par une erreur du
domaine précise, traduite dans chaque adapter primaire.

**Vérification en revue.** Imports, noms, champs et messages des erreurs du domaine : aucun vocabulaire de transport ou d'infrastructure.

## TENETS-ERROR-003 — Les erreurs applicatives représentent des issues d'orchestration

`core` · erreur

**Règle.** Une erreur applicative représente une issue significative du use case
(absence requise, rejet du workflow), pas un échec technique d'adapter.

**Pourquoi.** L'application décide comment les résultats des ports affectent le
workflow, sans dépendre de la mécanique des fournisseurs.

```ts
// ❌ Incorrect
throw new LigneIntrouvableEnBase(centreId);

// ✅ Correct
const centre = await this.centreRepository.get(commande.centreId);
if (centre === null) throw new CentreIntrouvable(commande.centreId);
```

**Correction.** Interpréter les résultats neutres des ports dans le use case et
lever une erreur de workflow seulement si nécessaire.

**Vérification en revue.** Les erreurs applicatives décrivent des issues métier,
sans parler de pilote, de protocole ni de SDK.

## TENETS-ERROR-004 — Les échecs sortants attendus sont déclarés à côté du port

`core` · erreur

**Règle.** Déclarer chaque échec sortant attendu, que le use case peut traiter, à
côté du contrat de port consommateur.

**Pourquoi.** La sémantique d'un échec fait partie du contrat ; un adapter ne
doit pas l'inventer.

```ts
// ❌ Incorrect — dans l'adapter
catch { throw new AdapterException(); }

// ✅ Correct — dans le fichier du port
export class StockageImagesIndisponible extends Error {
  readonly code = 'STOCKAGE_IMAGES_INDISPONIBLE';
}
export abstract class StockageImages {
  /** @throws StockageImagesIndisponible */
  abstract enregistrer(image: ImageMagasin): Promise<UrlPublique>;
}
```

**Correction.** Nommer l'échec attendu dans la langue de l'application ou du
domaine et le documenter avec le port.

**Vérification en revue.** Chaque échec d'adapter traité à l'intérieur a un type précis possédé par le port.

## TENETS-ERROR-005 — Les adapters secondaires traduisent des échecs fournisseurs précis

`core` · erreur

**Règle.** Un adapter secondaire intercepte des échecs techniques précis, lève
l'échec déclaré par le port et conserve la cause d'origine.

**Pourquoi.** Une traduction précise empêche les types fournisseurs de fuir,
conserve le diagnostic et évite de maquiller un bug.

```ts
// ❌ Incorrect
catch (e) { throw new StockageImagesIndisponible(); }         // tout est avalé, cause perdue

// ✅ Correct
catch (e) {
  if (isErrnoException(e) && (e.code === 'ENOSPC' || e.code === 'EACCES')) {
    throw new StockageImagesIndisponible({ cause: e });
  }
  throw e;
}
```

**Correction.** N'intercepter que les échecs fournisseurs connus et chaîner chaque cause.

**Vérification en revue.** Aucun `catch` large, aucune cause avalée, aucune erreur fournisseur qui traverse le port.

## TENETS-ERROR-006 — Les adapters primaires traduisent les échecs connus

`core` · erreur

**Règle.** Les adapters primaires traduisent les échecs connus (domaine,
application, ports) en réponses explicites du protocole.

**Pourquoi.** Statut HTTP, forme de réponse et codes de sortie appartiennent à la
frontière d'entrée, pas au code métier réutilisable.

```ts
// ❌ Incorrect — l'erreur sort non traduite et devient un 500

// ✅ Correct — un ExceptionFilter par contexte, dans ses adapters HTTP
const STATUTS = new Map<Type<Error>, HttpStatus>([
  [CentreIntrouvable, HttpStatus.NOT_FOUND],
  [CentreArchive, HttpStatus.CONFLICT],
  [StockageImagesIndisponible, HttpStatus.SERVICE_UNAVAILABLE],
]);

@Catch(...STATUTS.keys())
export class ReferentielHttpErrorFilter implements ExceptionFilter<Error & { code: string }> {
  catch(erreur: Error & { code: string }, hote: ArgumentsHost): void {
    const reponse = hote.switchToHttp().getResponse<Response>();
    const statut = STATUTS.get(erreur.constructor as Type<Error>) ?? HttpStatus.INTERNAL_SERVER_ERROR;
    reponse.status(statut).json({ statusCode: statut, code: erreur.code, message: erreur.message /* … */ });
  }
}
```

**Correction.** Centraliser la traduction de chaque échec connu dans l'adapter primaire.

**Vérification en revue.** Chaque échec connu aboutit à une réponse stable ; ni le domaine ni l'application ne choisissent le statut.

## TENETS-ERROR-007 — Les échecs inattendus s'arrêtent à une frontière externe

`core` · erreur

**Règle.** Laisser les échecs inattendus atteindre **une** vraie frontière de
sécurité externe, qui les journalise une seule fois avec un contexte de
corrélation et renvoie une réponse générique sûre.

**Pourquoi.** Les `catch` larges intermédiaires cachent des bugs et dupliquent
les logs ; la frontière externe empêche la fuite de SQL, de payloads et de stack traces.

```ts
// ❌ Incorrect
try {
  await this.centreRepository.save(centre);
} catch {
  return null;
}

// ✅ Correct — filtre global dans apps/api (APP_FILTER)
@Catch()
export class ErreursHttpGlobalesFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErreursHttpGlobalesFilter.name);
  catch(erreur: unknown, hote: ArgumentsHost): void {
    if (erreur instanceof HttpException) {
      /* réponse NestJS d'origine (400 de validation…) */ return;
    }
    this.logger.error('Échec non géré', erreur instanceof Error ? erreur.stack : String(erreur));
    hote.switchToHttp().getResponse<Response>().status(500).json({ statusCode: 500, code: 'INTERNAL_ERROR' });
  }
}
```

**Correction.** Supprimer les `catch` larges intermédiaires (sauf nettoyage qui
relance l'erreur) et installer un seul filtre global.

**Vérification en revue.** Journalisé une fois, aucun détail interne dans la réponse, jamais présenté comme un échec attendu.

## TENETS-ERROR-008 — Les types d'erreur vivent avec leur concept ou leur contrat

`pragmatic` · erreur

**Règle.** Ranger les erreurs dans des modules cohérents, possédés par leur
concept, capacité applicative ou contrat de port, et non dans un fourre-tout
partagé.

**Pourquoi.** L'emplacement des fichiers doit montrer la propriété et le sens des dépendances.

```text
❌ libs/shared-kernel/src/exceptions.ts : CentreArchive, CollecteIntrouvable, StockageImagesIndisponible

✅ libs/referentiel/domain/src/centre/centre.errors.ts
   libs/collecte/application/src/errors.ts
   libs/referentiel/application/src/ports/stockage-images.ts
```

**Correction.** Déplacer chaque erreur vers son propriétaire ; un petit module
peut garder l'erreur à côté du contrat qu'elle décrit.

**Vérification en revue.** Les modules d'erreurs partagés ne contiennent aucun concept propre à un contexte, un workflow, un port ou un fournisseur.

## TENETS-PATTERN-012 — Organisation des erreurs par couche (réécrit pour NestJS)

`pragmatic` · guide

```text
libs/referentiel/
  domain/src/centre/centre.errors.ts          erreurs métier (CentreArchive…)
  application/src/errors.ts                   issues de workflow (CentreIntrouvable…)
  application/src/ports/stockage-images.ts    port + StockageImagesIndisponible
  adapters/src/http/commun/filtres/referentiel-erreurs-http.filter.ts   traduction HTTP du contexte
apps/api/src/http/erreurs-http-globales.filter.ts       unique filtre global (APP_FILTER)
```

Un use case n'intercepte une erreur que s'il en fait quelque chose de
significatif (reprise, compensation, traduction métier). Sinon il la laisse
remonter jusqu'au filtre.
