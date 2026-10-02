---
paths:
  - 'libs/*/adapters/**/*.ts'
  - 'apps/api/src/**/*.ts'
---

# Adapters et API HTTP

- **Adapter primaire** : controller NestJS, tâche cron, consommateur de messages.
- **Adapter secondaire** : repository Prisma, stockage disque, export PDF/XLSX,
  horloge système.

## TENETS-ADAPTER-001 — Un adapter primaire appelle une capacité applicative

`core` · erreur

**Règle.** Un adapter primaire reçoit une interaction externe, la traduit en
entrée applicative, appelle **un** use case et répond via son protocole.

**Pourquoi.** L'adapter pilote l'application sans devenir propriétaire du workflow.

```ts
// ❌ Incorrect — le controller orchestre
@Post()
async creer(@Body() corps: CreerCentreRequete) {
  const centre = Centre.creer({ ...corps }, new Date());
  await this.centreRepository.save(centre);
}

// ✅ Correct
@Post()
async creer(@Body() corps: CreerCentreRequete): Promise<CentreReponse> {
  const centre = await this.creerCentre.execute(versCreerCentreCommande(corps));
  return versCentreReponse(centre);
}
```

**Correction.** Déplacer l'orchestration dans un use case ; laisser la
traduction et la délégation dans l'adapter.

**Vérification en revue.** Chaque route appelle une capacité applicative, jamais
directement un repository ou une fabrique du domaine.

## TENETS-ADAPTER-002 — L'adapter primaire valide et traduit l'entrée transport

`core` · erreur

**Règle.** L'adapter primaire valide la forme de la requête et le contexte
d'authentification, puis traduit la représentation externe en commande,
requête et valeurs sémantiques de l'application.

**Pourquoi.** Une entrée mal formée ne doit pas entrer dans l'application ; la
validation métier reste au domaine ou au use case.

```ts
// ❌ Incorrect
await this.creerCentre.execute(req.body);

// ✅ Correct — DTO class-validator + mapping explicite
export class CreerCentreRequete {
  @IsString() nom!: string;
  @IsString() codePostal!: string; // forme uniquement : pas de @Matches métier
}
const commande = versCreerCentreCommande(corps, utilisateurConnecte);
```

**Correction.** Ajouter un DTO de requête et un mapping explicite vers l'entrée applicative.

**Vérification en revue.** L'adapter gère champs requis et formats sans
dupliquer les décisions du domaine.

## TENETS-ADAPTER-003 — Réponses et erreurs protocolaires restent dans l'adapter primaire

`core` · erreur

**Règle.** L'adapter primaire traduit les résultats et les échecs connus en
réponses, codes de statut, en-têtes ou codes de sortie propres au protocole.

**Pourquoi.** La sémantique du transport ne doit pas fuir dans les use cases ni le domaine.

```ts
// ❌ Incorrect — le use case connaît HTTP
throw new NotFoundException('Centre introuvable'); // dans libs/*/application

// ✅ Correct
throw new CentreIntrouvable(centreId); // application
// … et un ExceptionFilter de l'adapter HTTP le traduit en 404
```

**Correction.** Renvoyer un résultat possédé par l'application et faire le
mapping protocolaire dans l'adapter.

**Vérification en revue.** Types de retour et exceptions des use cases : aucun
concept HTTP, CLI ou framework.

## TENETS-ADAPTER-004 — L'adapter secondaire implémente et traduit un contrat de port

`core` · erreur

**Règle.** Un adapter secondaire implémente un port et traduit entre ses types
sémantiques et une technologie ou un contrat externe.

**Pourquoi.** Une traduction explicite préserve le contrat du port tout en
contenant les changements de représentation externe.

```ts
// ❌ Incorrect — service technique générique
@Injectable()
export class FichierService {
  ecrire(chemin: string, octets: Buffer) {}
}

// ✅ Correct
@Injectable()
export class DisqueStockageImages extends StockageImages {
  async enregistrer(image: ImageMagasin): Promise<UrlPublique> {
    const chemin = versCheminDisque(image);
    await writeFile(chemin, image.contenu);
    return versUrlPublique(chemin);
  }
}
```

**Correction.** Implémenter directement le port consommateur et ajouter un mapping directionnel.

**Vérification en revue.** Les méthodes publiques de l'adapter respectent exactement le contrat du port.

## TENETS-ADAPTER-005 — Les modèles externes restent dans leur adapter

`core` · erreur

**Règle.** Objets de SDK, modèles Prisma, schémas de transport et types propres
à une technologie restent privés à l'adapter qui fait leur mapping.

**Pourquoi.** Les modèles externes changent pour des raisons techniques et ne
doivent pas devenir des contrats partagés.

```ts
// ❌ Incorrect
async get(id: CentreId): Promise<Prisma.CentreGetPayload<{}> | null>

// ✅ Correct
async get(id: CentreId): Promise<Centre | null>
```

**Correction.** Mapper l'objet externe vers un résultat sémantique avant de le renvoyer.

**Vérification en revue.** Aucun type Prisma, Express ou fournisseur dans les signatures tournées vers l'intérieur.

## TENETS-ADAPTER-006 — L'adapter secondaire traduit les échecs techniques attendus

`core` · erreur

**Règle.** Un adapter secondaire intercepte des échecs techniques **précis** et
les traduit en échecs déclarés à côté du port, en conservant la cause d'origine.

**Pourquoi.** Les use cases réagissent à des échecs de capacité sans dépendre
des classes d'erreur d'un fournisseur.

```ts
// ❌ Incorrect — l'erreur Prisma fuit vers l'intérieur
await this.prisma.centre.create({ data });

// ✅ Correct
try {
  await this.prisma.centre.create({ data });
} catch (erreur) {
  if (erreur instanceof Prisma.PrismaClientKnownRequestError && erreur.code === 'P2002') {
    throw new CentreDejaExistant(centre.id, { cause: erreur });
  }
  throw erreur;
}
```

**Correction.** Définir l'échec attendu de la capacité, n'intercepter que les
erreurs techniques correspondantes et chaîner la cause (`{ cause }`).

**Vérification en revue.** Aucune erreur fournisseur ne traverse le port, aucun
`catch` large, aucune cause perdue.

## TENETS-ADAPTER-007 — Les repositories reconstituent les objets persistés

`core` · erreur (réécrit pour TypeScript)

**Règle.** Un adapter de repository reconstruit des objets complets du domaine
via `reconstituer()` et des mappers directionnels. Il n'appelle jamais
`creer()`.

**Pourquoi.** Une lecture reconstruit un cycle de vie existant et ne doit
générer ni nouvelle identité, ni valeurs par défaut, ni événement de création.

```ts
// ❌ Incorrect
function versCentre(ligne: CentreRow): Centre {
  return Centre.creer({ nom: ligne.nom /* … */ }, ligne.createdAt);
}

// ✅ Correct
function versCentre(ligne: CentreRow): Centre {
  return Centre.reconstituer({
    id: CentreId.creer(ligne.id),
    nom: Nom.creer(ligne.nom),
    statut: versStatutCentre(ligne.statut),
    creeLe: ligne.createdAt,
    modifieLe: ligne.updatedAt,
  });
}
```

**Correction.** Remplacer les appels de création par un mapping explicite qui
fournit toute l'identité et tout l'état persistés.

**Vérification en revue.** Aucun `.creer(` dans les adapters de repository ;
mapping complet.

## TENETS-API-001 — Une API externe n'expose jamais les modèles de persistance

`core` · erreur

**Règle.** Requêtes et réponses HTTP n'utilisent jamais de modèle Prisma, de
ligne SQL ni d'enregistrement sérialisé comme contrat public.

**Pourquoi.** La structure de la base est un détail d'implémentation aux
exigences de compatibilité et de sécurité différentes.

```ts
// ❌ Incorrect
@Get(':id') get(@Param('id') id: string) { return this.prisma.centre.findUnique({ where: { id } }); }

// ✅ Correct
@Get(':id')
async get(@Param('id') id: string): Promise<CentreReponse> {
  return versCentreReponse(await this.obtenirCentre.execute(versObtenirCentreRequete(id)));
}
```

**Correction.** Définir un schéma d'API possédé par l'adapter et mapper depuis un résultat interne.

**Vérification en revue.** Aucun type de persistance dans les signatures et valeurs renvoyées des controllers.

## TENETS-API-002 — Les schémas externes appartiennent aux adapters primaires

`core` · erreur

**Règle.** Les DTO HTTP (requêtes et réponses) appartiennent à leur adapter
primaire, pas au domaine ni à l'application.

**Pourquoi.** Les contrats de transport portent des préoccupations de
sérialisation qui doivent évoluer indépendamment.

```text
❌ libs/referentiel/domain/src/centre.reponse.ts          (décorateurs class-validator)
✅ libs/referentiel/adapters/src/http/centres/reponses/centre.reponse.ts
```

**Correction.** Déplacer les DTO dans l'adapter et les mapper vers et depuis les
entrées et résultats applicatifs.

**Vérification en revue.** Aucun `class-validator`, `class-transformer` ni
décorateur Swagger dans `domain` et `application` (bloqué par le lint).

> **Contrats partagés avec le front.** Si des DTO sont partagés avec Angular via
> une lib `shared`, ils restent des contrats de transport : seuls les adapters
> HTTP les importent, jamais `domain` ni `application`.

## TENETS-API-003 — L'adapter primaire mappe les résultats avant de les exposer

`core` · erreur

**Règle.** L'adapter primaire transforme objets du domaine et résultats
applicatifs en représentation de réponse explicite avant de franchir la
frontière du protocole.

**Pourquoi.** Un mapping explicite évite l'exposition accidentelle de données et
découple la compatibilité publique de l'évolution interne.

```ts
// ❌ Incorrect — sérialisation automatique de l'agrégat
return centre;

// ✅ Correct
return versCentreReponse(centre);
```

**Correction.** Définir les champs de réponse voulus et un mapper directionnel dans l'adapter.

**Vérification en revue.** Aucun controller ne renvoie un objet interne tel quel.

## TENETS-VALIDATE-002 — L'adapter primaire valide la forme de l'entrée externe

`core` · erreur

**Règle.** L'adapter primaire valide la forme du protocole et mappe les entrées
valides vers les types de l'application ou du domaine, **sans dupliquer les
invariants du domaine**.

**Pourquoi.** Les champs JSON obligatoires relèvent du protocole ; le sens
métier reste unique et fait autorité dans le domaine.

```ts
// ❌ Incorrect — règle métier dupliquée dans le DTO
@Matches(/^0[1-79]\d{8}$/) telephone?: string;

// ✅ Correct — forme seulement ; Telephone.creer() porte la règle métier
@IsOptional() @IsString() telephone?: string;
```

**Correction.** Garder uniquement les contrôles de forme dans le DTO et mapper
explicitement vers les types sémantiques.

**Vérification en revue.** Les données mal formées s'arrêtent à l'adapter ; aucune
règle du domaine n'y est réimplémentée.
