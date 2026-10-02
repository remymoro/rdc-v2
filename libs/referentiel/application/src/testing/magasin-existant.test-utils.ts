import {
  Adresse,
  CentreId,
  CodePostal,
  Magasin,
  MagasinId,
  Nom,
  StatutMagasin,
  Ville,
} from '@rdc/referentiel-domain';

/** Un magasin déjà en base, dans le statut voulu (TENETS-TEST-005). */
export function unMagasinExistant(
  magasinId: MagasinId,
  statut: StatutMagasin,
): Magasin {
  return Magasin.reconstituer({
    id: magasinId,
    nom: Nom.creer('Leclerc Agen Sud'),
    adresse: Adresse.creer('1 avenue du Général de Gaulle'),
    codePostal: CodePostal.creer('47000'),
    ville: Ville.creer('Agen'),
    centreId: CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12'),
    statut,
    images: [],
    creeLe: new Date('2026-10-01T09:00:00.000Z'),
    modifieLe: new Date('2026-10-01T09:00:00.000Z'),
  });
}
