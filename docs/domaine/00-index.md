# Connaissance métier RDC v2

Ce dossier décrit **ce que fait** RDC : le vocabulaire, les contextes et les
règles métier à respecter. Les règles d'architecture, qui disent **comment**
construire, sont dans `docs/architecture/regles/` (identifiants `TENETS-XXX-NNN`).

Source : le code et la documentation de RDC v1 (`../rdc`), relus le 2026-10-01.
On reprend le métier, pas le code.

## Comment l'utiliser

- **Avant de coder dans un contexte** : lire `docs/domaine/<contexte>.md`. Le
  fichier se charge automatiquement quand on modifie `libs/<contexte>/**`.
- **Nommer** : uniquement avec les termes de `glossaire.md`. Un terme absent du
  glossaire s'y ajoute avant d'entrer dans le code (TENETS-NAME-001).
- **En revue** : citer l'identifiant `RDC-XXX-NNN` de la règle métier, à côté de
  la règle d'architecture `TENETS-XXX-NNN`.
- **Règle marquée ⚠️ à trancher** : ne pas l'implémenter avant la décision ;
  voir `a-trancher.md`. Une fois tranchée : mettre à jour la règle, et écrire un
  ADR si la décision s'écarte de la v1.
- Un identifiant n'est jamais renuméroté ni réutilisé. Une règle abandonnée
  reste dans son fichier avec l'état `abandonnée`.

## Format d'une règle

```text
## RDC-<CTX>-NNN — Titre
`niveau` · sévérité · état v2

**Règle.** Ce qui doit toujours être vrai.
**Pourquoi.** La raison métier.
❌ / ✅ exemple TypeScript (conventions v2 : creer(), maintenant, erreurs à code)
**Vérification en revue.** Ce que le relecteur contrôle.
**Source v1.** Où la règle vit dans ../rdc.
```

États v2 : ✅ implémentée · ⏳ à implémenter · 🔁 reportée (étape indiquée) ·
⚠️ à trancher.

## Carte des contextes

```text
                       ┌───────────────────┐
                       │  identite-acces   │  utilisateurs, rôles, périmètre « mon centre »
                       └─────────┬─────────┘
                                 │ qui peut faire quoi
┌──────────────┐   ids   ┌───────▼────────┐  ids   ┌──────────────┐
│ referentiel  ├────────►│    collecte    │◄───────┤  benevoles   │
│ centres      │         │ cycle de vie,  │        │ identité,    │
│ magasins     │         │ participations,│        │ engagement,  │
│ produits     │         │ état de saisie │        │ RGPD         │
└──────┬───────┘         └──┬──────────┬──┘        └──────┬───────┘
       │ instantané produit │ période, │ planification     │ identité du bénévole
       │                    │ fenêtre  │ ouverte           │
       │             ┌──────▼──┐   ┌───▼───────────┐       │
       └────────────►│ saisie  │   │ planification │◄──────┘
                     │ pesées  │   │ créneaux      │
                     └────┬────┘   └──────┬────────┘
                          │ poids          │ créneaux
                     ┌────▼────────────────▼───┐
                     │      statistiques       │  lecture seule (ADR-0003 R14)
                     └─────────────────────────┘
```

| Contexte         | Fichier             | Possède                                                                                          | Préfixe        |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------ | -------------- |
| `referentiel`    | `referentiel.md`    | Centre, Magasin (images, rattachement), Produit (catalogue)                                      | `RDC-REF`      |
| `identite-acces` | `identite-acces.md` | Utilisateur, rôles ADMIN / RESPONSABLE_CENTRE, sessions, périmètre                               | `RDC-ACCES`    |
| `benevoles`      | `benevoles.md`      | Bénévole, type d'engagement, anonymisation                                                       | `RDC-BENEVOLE` |
| `collecte`       | `collecte.md`       | Collecte, période, fenêtre de saisie, listes de vérification, participations, saisie d'un centre | `RDC-COLLECTE` |
| `planification`  | `planification.md`  | Plannings magasin / bénévoles centre / chauffeur, créneaux                                       | `RDC-PLANIF`   |
| `saisie`         | `saisie.md`         | Pesée (passage), articles pesés, validation                                                      | `RDC-SAISIE`   |
| `statistiques`   | `statistiques.md`   | Synthèses, comparaisons N-1 / N, exports                                                         | `RDC-STATS`    |

Relations à respecter (TENETS-CONTEXT-002 à 006) :

- Les contextes s'échangent des **identifiants** (`CentreId`, `MagasinId`…) et
  des contrats publiés, jamais leurs agrégats.
- `collecte` est la référence pour « le magasin est-il inscrit ? », « quel
  centre gère ce magasin pour cette collecte ? », « la saisie est-elle ouverte ? ».
  `planification` et `saisie` interrogent ces contrats, sans les recalculer.
- `saisie` et `planification` copient les données qui doivent rester stables
  dans le temps (référence produit, type d'engagement) : ce sont des instantanés.
- `statistiques` lit tout et n'écrit rien.

Ordre de construction proposé : referentiel → identite-acces → collecte →
benevoles → planification → saisie → statistiques. La feuille de route regroupe
bénévoles, planification et saisie dans l'étape 6 ; leur ordre interne reste à
trancher (D-01), car planification dépend de bénévoles et saisie des contrats de
collecte.

## Les 10 invariants métier à ne jamais casser

1. Collecte : PREPARATION → EN_COURS → TERMINEE, sans retour (RDC-COLLECTE-001).
2. La clôture d'une collecte est toujours décidée par l'admin, et seulement quand tous les centres ont terminé leur saisie (RDC-COLLECTE-005).
3. Seul l'admin inscrit les magasins, en préparation ; inscrire = accord du magasin obtenu, la participation n'a pas de statut (RDC-COLLECTE-004, 017) ; l'accord est recueilli par la vérification que le siège ouvre et que chaque centre lui transmet (RDC-COLLECTE-014, 020).
4. On ne pèse que dans la fenêtre de saisie, ou après une réouverture tracée par l'admin ; la saisie obligatoire de sa raison reste à décider (RDC-SAISIE-001, RDC-COLLECTE-010, D-13).
5. Un poids est strictement positif et n'est jamais arrondi vers le bas (RDC-SAISIE-002).
6. Un bénévole n'est jamais sur deux créneaux qui se chevauchent, tous plannings confondus (RDC-PLANIF-003).
7. Un créneau est inclus dans la période de la collecte, et n'est modifiable que si la planification est ouverte (RDC-PLANIF-001/002).
8. Un bénévole anonymisé ne redevient jamais identifiable (RDC-BENEVOLE-001).
9. Un élément archivé (centre, magasin) ne change plus jamais d'état (RDC-REF-002).
10. Un responsable de centre ne voit et ne modifie que son centre (RDC-ACCES-002).
