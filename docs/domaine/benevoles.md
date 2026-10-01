---
paths:
  - 'libs/benevoles/**/*'
---

# Règles métier — contexte `benevoles`

Un bénévole est une personne, pas un utilisateur de l'application : ses données
sont personnelles et soumises au RGPD.

## RDC-BENEVOLE-001 — L'anonymisation est irréversible

`core` · erreur · ⏳ à implémenter (étape 6)

**Règle.** `anonymiser()` remplace l'identité (nom, prénom, téléphone, email)
par une identité anonyme et marque le bénévole comme anonymisé. Anonymiser deux
fois est sans effet. Ensuite, toute modification d'identité ou d'engagement
est refusée (`BENEVOLE_ANONYMISE`, 409). L'anonymisation s'exécute dans une
unité de travail. Les créneaux passés restent, rattachés au bénévole anonymisé.

**Pourquoi.** Une personne anonymisée ne doit jamais pouvoir être
réidentifiée.

```ts
// ❌ Incorrect
benevole.modifierIdentite({ nom: ancienNom }, maintenant); // après anonymisation

// ✅ Correct
benevole.anonymiser(maintenant); // définitif ; modifierIdentite lève BenevoleAnonymise
```

**Vérification en revue.** Aucun chemin (use case, amorçage, script) ne remet le
marqueur à faux.

**Source v1.** `benevole/benevole.entity.ts`, `benevole/value-objects/benevole-identity.vo.ts`.

## RDC-BENEVOLE-002 — Un bénévole appartient à un centre ; email et téléphone uniques par centre

`core` · erreur · ⏳ à implémenter

**Règle.** Chaque bénévole est rattaché à un centre. Dans un centre, deux
bénévoles ne partagent ni email ni téléphone. Les recherches et contrôles de
doublon sont toujours limités au centre. Un responsable ne gère que les
bénévoles de son centre (RDC-ACCES-002).

**Pourquoi.** Le centre est l'unité opérationnelle et le périmètre de
traitement des données.

**Source v1.** `prisma/schema.prisma#Benevole` (`@@unique([centreId, email])`, `@@unique([centreId, tel])`).

## RDC-BENEVOLE-003 — Type d'engagement

`core` · erreur · ⏳ à implémenter

**Règle.** Deux types : `BNV_Restos` (bénévole régulier, par défaut) et
`BNV_1_jour` (bénévole d'une journée). Le type est copié dans chaque créneau
(RDC-PLANIF-004).

**Source v1.** `prisma/schema.prisma#TypeEngagement`.

## RDC-BENEVOLE-004 — Durée de conservation

`pragmatic` · avertissement · ⚠️ à trancher (D-06)

**Règle.** Les données des bénévoles inactifs, en particulier `BNV_1_jour`,
sont anonymisées automatiquement après une durée à définir. Absent en v1
(audit B-02).

**Pourquoi.** RGPD art. 5.1.e : pas de conservation illimitée.

## RDC-BENEVOLE-005 — Pas de création implicite

`pragmatic` · avertissement · ⚠️ à trancher (D-05)

**Règle.** Un bénévole se crée par son propre parcours, jamais en effet de bord
d'un planning (voir RDC-PLANIF-006).
