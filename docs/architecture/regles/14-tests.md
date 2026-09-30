---
paths:
  - 'libs/**/*.ts'
  - 'apps/**/*.ts'
---

# Tests (TDD)

Cycle obligatoire (ADR-0004) : **un** test rouge → le code minimal qui le fait
passer → nettoyage. Outil : Jest (`pnpm nx test <projet>`).

| Niveau            | Où                                   | Avec quoi                                                   |
| ----------------- | ------------------------------------ | ----------------------------------------------------------- |
| Domaine           | `libs/*/domain/**/*.spec.ts`         | Vrais objets du domaine, aucune infrastructure              |
| Use case          | `libs/*/application/**/*.spec.ts`    | Vrai use case + fakes en mémoire des ports                  |
| Contrat d'adapter | `libs/*/adapters/**/*.spec.ts`       | Même suite pour l'adapter en mémoire et Prisma (PostgreSQL) |
| Workflow HTTP     | `apps/api-e2e` ou test d'intégration | Application NestJS complète                                 |

## TENETS-TEST-001 — Le domaine est testé sans infrastructure

`core` · avertissement

**Règle.** Tester entités, agrégats, value objects et services de domaine avec de
vrais objets du domaine, sans repository, adapter, framework, base ni client externe.

**Pourquoi.** Un test de domaine prouve le comportement métier, pas une configuration de mocks.

```ts
// ❌ Incorrect
const collecte = { demarrer: jest.fn() } as unknown as Collecte;
collecte.demarrer(maintenant);
expect(collecte.demarrer).toHaveBeenCalled();

// ✅ Correct
const collecte = Collecte.creer({ id, nom, periode }, veille);
collecte.inscrireMagasin(magasinId, centreId, veille);
collecte.demarrer(jourJ);
expect(collecte.statut).toBe(StatutCollecte.EN_COURS);
```

**Correction.** Remplacer les objets du domaine simulés par les vrais points
d'entrée et vérifier le comportement observable.

**Vérification en revue.** Les tests du domaine tournent sans infrastructure et exercent un vrai comportement.

## TENETS-TEST-002 — Les use cases sont testés avec des ports isolés

`core` · avertissement

**Règle.** Instancier le vrai use case avec des implémentations contrôlées de ses
ports, et tester orchestration, résultats et comportement transactionnel.

**Pourquoi.** Le test prouve chargement, appel du domaine, appels sortants,
gestion d'échec et décision de commit, sans infrastructure réelle.

```ts
// ❌ Incorrect
const useCase = { execute: jest.fn() };

// ✅ Correct
const centreRepository = new CentreRepositoryEnMemoire([centre]);
const unitOfWork = new UnitOfWorkEspion();
await new ArchiverCentreUseCase(centreRepository, unitOfWork, horlogeFixe).execute({ centreId: centre.id });
expect((await centreRepository.get(centre.id))?.statut).toBe(StatutCentre.ARCHIVE);
expect(unitOfWork.nombreDeCommits).toBe(1);
```

**Correction.** Composer le vrai use case avec de petits fakes, stubs ou espions.

**Vérification en revue.** Chaque use case a des tests pour le succès, l'absence
ou l'échec attendu, et l'issue transactionnelle.

## TENETS-TEST-003 — Chaque adapter secondaire prouve son contrat de port

`pragmatic` · avertissement

**Règle.** Exécuter une suite de tests de contrat réutilisable contre chaque
implémentation significative d'un port.

**Pourquoi.** Toutes les implémentations doivent avoir les mêmes entrées, sorties,
absence, traduction d'échecs et garanties transactionnelles.

```text
❌ Le repository en mémoire a ses tests ; on suppose que Prisma se comporte pareil.
✅ verifierContratCentreRepository() tourne contre les deux (ADR-0003 R10).
```

**Correction.** Extraire le comportement promis dans une suite paramétrée par la
fabrique de l'adapter.

**Vérification en revue.** Chaque adapter secondaire exécute la suite de son port, plus ses tests techniques propres.

## TENETS-TEST-004 — Les tests d'intégration couvrent des workflows complets

`pragmatic` · avertissement

**Règle.** Un test de workflow relie un vrai adapter primaire, le use case et le
domaine à des adapters secondaires réels ou contrôlés.

**Pourquoi.** Ce niveau prouve la composition et les mappings de frontière que les tests isolés ne voient pas.

```text
❌ Controller testé avec un use case mocké → « 201 » ne prouve rien.

✅ supertest → CentreController → CreerCentreUseCase → Centre
   → PrismaCentreRepository (PostgreSQL de test) → réponse 201 + ligne en base
```

**Correction.** Construire un module de test qui garde la sémantique des ports de
production et ne remplace que les capacités externes hors du périmètre.

**Vérification en revue.** Les workflows critiques (création, cycle de vie de collecte, clôture) ont un test d'intégration.

## TENETS-TEST-005 — Les tests distinguent création et reconstitution

`pragmatic` · avertissement (réécrit pour TypeScript)

**Règle.** Utiliser `creer()` quand un test a besoin d'un nouvel objet, et
`reconstituer()` (ou le mapper de repository) quand il a besoin d'un état persisté.

**Pourquoi.** Un test qui recrée un objet persisté via `creer()` peut masquer un
défaut de cycle de vie (identité, valeurs par défaut, événements au mauvais moment).

```ts
// ❌ Incorrect — une collecte « EN_COURS » obtenue en détournant creer()
const collecte = Collecte.creer({ id, nom, periode }, maintenant);
collecte['statut'] = StatutCollecte.EN_COURS;

// ✅ Correct
const nouvelle = Collecte.creer({ id, nom, periode }, maintenant);
const enCours = Collecte.reconstituer({ ...etatDeBase, statut: StatutCollecte.EN_COURS });
```

**Correction.** Choisir le point d'entrée selon le sens du cycle de vie ; nommer
les fixtures `nouvelle…` ou `persistee…`.

**Vérification en revue.** Aucune fixture qui détourne `creer()` pour simuler un état persisté.

## TENETS-TEST-006 — Les tests de port vérifient des valeurs sémantiques

`pragmatic` · avertissement

**Règle.** Les tests vérifient que repositories et ports reçoivent et renvoient
l'agrégat, le value object, le critère ou le contrat requis.

**Pourquoi.** Tester seulement un nombre d'appels ou une égalité de primitives
laisse passer des fuites de primitives.

```ts
// ❌ Incorrect
expect(centreRepository.get).toHaveBeenCalledWith('c3f1…');

// ✅ Correct
expect(centreRepositoryEspion.identifiantsDemandes).toEqual([CentreId.creer('c3f1…')]);
expect(centreRepositoryEspion.identifiantsDemandes[0]).toBeInstanceOf(CentreId);
```

**Correction.** Vérifier à la fois la valeur sémantique et son type aux frontières de port.

**Vérification en revue.** Aucun test de port qui accepte une chaîne, un objet littéral ou un modèle Prisma à la place d'un type du domaine.

## TENETS-PATTERN-011 — Tests de contrat d'un port de repository (réécrit pour Jest)

`pragmatic` · guide

```ts
// libs/referentiel/domain/src/ports/centre.repository.contrat.test-utils.ts
// Suffixe .test-utils.ts : fichier de test partagé, à exclure du build de la lib
// (ajouter "src/**/*.test-utils.ts" à l'exclude de tsconfig.lib.json et l'include de tsconfig.spec.json).
export function verifierContratCentreRepository(nom: string, fabrique: () => Promise<{ repository: CentreRepository; nettoyer: () => Promise<void> }>): void {
  describe(`${nom} respecte le contrat CentreRepository`, () => {
    let repository: CentreRepository;
    let nettoyer: () => Promise<void>;
    beforeEach(async () => ({ repository, nettoyer } = await fabrique()));
    afterEach(() => nettoyer());

    it("sauvegarde puis relit l'agrégat complet", async () => {
      const centre = unNouveauCentre();
      await repository.save(centre);
      const relu = await repository.get(centre.id);
      expect(relu?.id.equals(centre.id)).toBe(true);
      expect(relu?.statut).toBe(centre.statut);
    });

    it('renvoie null pour un centre absent', async () => {
      expect(await repository.get(CentreId.creer('inexistant'))).toBeNull();
    });
  });
}

// En mémoire (tests unitaires) et Prisma (tests d'intégration, PostgreSQL en CI)
verifierContratCentreRepository('CentreRepositoryEnMemoire', async () => ({ repository: new CentreRepositoryEnMemoire(), nettoyer: async () => {} }));
verifierContratCentreRepository('PrismaCentreRepository', creerPrismaCentreRepositoryDeTest);
```

La suite commune ne teste que ce que promet le port. Contraintes d'unicité,
index et spécificités SQL ont leurs propres tests d'adapter.
