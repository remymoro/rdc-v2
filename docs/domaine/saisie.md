---
paths:
  - 'libs/saisie/**/*'
---

# Règles métier — contexte `saisie`

Une pesée enregistre les poids collectés dans un magasin, produit par produit,
lors d'un passage. Le droit de peser est décidé par `collecte`
(RDC-COLLECTE-013) ; `saisie` ne recalcule ni la fenêtre ni l'état du centre.

## RDC-SAISIE-001 — On ne pèse que si la collecte l'autorise pour ce centre

`core` · erreur · ⏳ à implémenter (étape 6)

**Règle.** Créer ou valider une pesée exige :

- un magasin inscrit à la collecte ;
- une collecte EN_COURS ;
- maintenant dans la fenêtre de saisie, **ou** la saisie du centre
  gestionnaire rouverte par l'admin ;
- un centre gestionnaire qui n'a pas déclaré sa saisie terminée.

Ces quatre conditions sont fournies par le contrat publié de `collecte`.

**Pourquoi.** Après la fenêtre, les chiffres doivent se stabiliser : seule une
décision tracée de l'admin les rouvre.

```ts
// ❌ Incorrect : règle recalculée dans saisie
if (collecte.dateFin >= maintenant) await this.pesees.save(pesee);

// ✅ Correct
const droit = await this.droitDeSaisie.pour(collecteId, magasinId, maintenant); // port publié par collecte
if (!droit.autorise) throw new SaisieFermee(droit.motif);
```

**Vérification en revue.** Chaque use case qui écrit une pesée consulte le
contrat, dans la même unité de travail que l'écriture. Codes v1 :
`COLLECTE_SAISIE_FERMEE`, `COLLECTE_SAISIE_CENTRE_TERMINEE`, `MAGASIN_NON_INSCRIT`.

**Source v1.** `apps/api/src/presentation/http/controllers/saisie.controller.ts:39-70` ;
`apps/api/src/application/use-cases/saisie/valider-saisie-entry.usecase.ts:51-85`.

## RDC-SAISIE-002 — Un poids est strictement positif et n'est jamais arrondi vers le bas

`core` · erreur · ⏳ à implémenter

**Règle.** `Poids` est un value object stocké en millièmes de kg (entier).
Création : valeur finie et > 0, arrondie au millième **supérieur**.
Reconstitution : arrondi au plus proche, pour corriger le bruit des nombres à
virgule. Les totaux s'additionnent en millièmes.

**Pourquoi.** Arrondir vers le bas ferait perdre du poids réellement collecté ;
additionner des nombres à virgule crée des écarts dans les totaux.

```ts
// ❌ Incorrect
const total = articles.reduce((s, a) => s + a.poidsKg, 0);

// ✅ Correct
const poids = Poids.depuisKg(saisi); // ceil au millième ; PoidsInvalide si <= 0
const total = articles.map((a) => a.poids).reduce((s, p) => s.ajouter(p), Poids.zero());
```

**Vérification en revue.** Aucun calcul de poids en `number` à virgule dans le
domaine. Base : `Decimal(10, 3)`. Code v1 : `POIDS_KG_INVALIDE`.

**Source v1.** `libs/domain/src/saisie/value-objects/poids-kg.vo.ts:3-41`.

## RDC-SAISIE-003 — Une pesée contient au moins un article, et son numéro de passage se suit

`core` · erreur · ⏳ à implémenter

**Règle.** Une pesée concerne un couple (collecte, magasin) et contient au
moins un article. En v1, les identifiants d'article sont des UUID générés par le
serveur : leur absence de doublon est une garde technique, pas une règle
interdisant deux lignes du même produit. Le prochain numéro de passage est
calculé par `max + 1` hors transaction et sans contrainte unique ; garantir
réellement 1, 2, 3… sans doublon est une amélioration v2.

**Pourquoi.** Le numéro de passage sert à suivre les allers-retours au magasin
pendant la collecte ; deux pesées simultanées ne doivent pas obtenir le même.

**Vérification en revue.** Code v1 : `SAISIE_ENTRY_VIDE`. La v2 ajoute un test de
concurrence ou une contrainte unique (collecte, magasin, numéro) en base.

**Source v1.**
`apps/api/src/application/use-cases/saisie/creer-saisie-entry.usecase.ts:91-113`.

## RDC-SAISIE-004 — Valider une pesée déjà validée est une erreur

`pragmatic` · erreur · ⚠️ à trancher (D-08)

**Règle.** `valider()` passe EN_COURS → VALIDEE. Une pesée déjà validée lève
une erreur (`SAISIE_ENTRY_ALREADY_VALIDATED`) : cette transition n'est
volontairement pas idempotente. Ce que la validation change pour la suite
(modification interdite ? prise en compte dans les statistiques ?) reste à
préciser (D-08).

**Pourquoi.** Une double validation révèle un flux anormal (double clic,
rejeu) que l'appelant doit connaître.

```ts
// ❌ Incorrect
if (!pesee.estValidee()) pesee.valider(maintenant); // masque l'anomalie

// ✅ Correct
pesee.valider(maintenant); // PeseeDejaValidee
```

**Source v1.** `libs/domain/src/saisie/saisie-entry.entity.ts:245-261`.

## RDC-SAISIE-005 — Un article pesé fige la référence du produit

`core` · erreur · ⚠️ source de la référence à trancher (D-11)

**Règle.** Chaque article copie la référence, la famille et la sous-famille au
moment de la pesée. En v1, ces valeurs viennent directement du client, sans
validation contre le catalogue ; `ReferenceProduit` est une chaîne libre de 50
caractères au plus, distincte de `CodeProduit`. La v2 doit décider si elle
conserve cette liberté ou impose le catalogue (D-11). L'article n'a pas de clé
étrangère vers le catalogue.

**Pourquoi.** Le catalogue évolue (désactivation, reclassement) ; les
statistiques des années passées doivent rester identiques.

```ts
// ❌ Incorrect
articles: [{ produitId, poids }]; // les stats joindront le catalogue actuel

// ✅ Correct
articles: [{ referenceSaisie, familleSaisie, sousFamilleSaisie, poids }];
```

**Vérification en revue.** Les statistiques par famille lisent l'article, pas
le catalogue.

**Source v1.**
`apps/api/src/application/use-cases/saisie/creer-saisie-entry.usecase.ts:101-113` ;
`libs/domain/src/produit/value-objects/reference-produit.vo.ts:3-20`.

## RDC-SAISIE-006 — Une pesée appartient au centre gestionnaire, pas au centre de rattachement

`core` · erreur · ⏳ à implémenter

**Règle.** Le centre responsable d'une pesée est le **centre gestionnaire** du
magasin pour cette collecte (RDC-COLLECTE-013), qui peut différer du centre de
rattachement permanent du magasin.

**Pourquoi.** Un magasin peut être réassigné à un autre centre le temps d'une
collecte.

```ts
// ❌ Incorrect
const centreId = magasin.centreId;
// ✅ Correct
const centreId = await this.participations.centreGestionnaire(collecteId, magasinId);
```

**Vérification en revue.** Les contrôles de droit et de périmètre utilisent le
centre gestionnaire.

**Source v1.**
`apps/api/src/application/use-cases/saisie/creer-saisie-entry.usecase.ts:63-89`.
