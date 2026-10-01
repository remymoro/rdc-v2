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

**Source v1.** `libs/domain/src/benevole/benevole.entity.ts:108-153` ;
`libs/domain/src/benevole/value-objects/benevole-identity.vo.ts:28-82`.

## RDC-BENEVOLE-002 — Un bénévole appartient à un centre ; email et téléphone uniques par centre

`core` · erreur · ⏳ à implémenter (étape 6)

**Règle.** Chaque bénévole est rattaché à un centre. Dans un centre, deux
bénévoles ne partagent ni email ni téléphone. Les recherches et contrôles de
doublon sont toujours limités au centre. Un responsable ne gère que les
bénévoles de son centre (RDC-ACCES-002). Un nouveau bénévole ne peut être
rattaché qu'à un centre ACTIF (RDC-REF-010).

**Pourquoi.** Le centre est l'unité opérationnelle et le périmètre de
traitement des données.

**Source v1.** `apps/api/prisma/schema.prisma:182-203`.

## RDC-BENEVOLE-003 — Type d'engagement

`core` · erreur · ⏳ à implémenter (étape 6)

**Règle.** Deux types : `BNV_Restos` (bénévole régulier, par défaut) et
`BNV_1_jour` (bénévole d'une journée). Le type est copié dans chaque créneau
(RDC-PLANIF-004).

**Source v1.** `libs/domain/src/benevole/benevole.entity.ts:6-8,32-52` ;
`apps/api/prisma/schema.prisma:329-332`.

## RDC-BENEVOLE-004 — Durée de conservation

`pragmatic` · avertissement · ⚠️ à trancher (D-06)

**Règle.** Les données des bénévoles inactifs, en particulier `BNV_1_jour`,
sont anonymisées automatiquement après une durée à définir. Absent en v1
(audit B-02).

**Pourquoi.** RGPD art. 5.1.e : pas de conservation illimitée.

## RDC-BENEVOLE-005 — Pas de création implicite

`pragmatic` · avertissement · ⚠️ à trancher (D-05)

**Règle.** En v1, les plannings magasin et chauffeur rapprochent le bénévole par
email, puis téléphone, puis homonyme unique ; sans correspondance, ils le créent
implicitement dans le centre gestionnaire. La v2 doit décider si cette création
reste permise hors du parcours bénévole (voir RDC-PLANIF-006).

**Source v1.**
`apps/api/src/application/use-cases/planning-magasin/planifier-benevoles-magasin.usecase.ts:114-125,152-185` ;
`apps/api/src/application/use-cases/planning-chauffeur/planifier-chauffeur.usecase.ts:127-139,165-190`.
