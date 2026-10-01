import {
  Adresse,
  Centre,
  CentreId,
  CodePostal,
  Nom,
  StatutCentre,
  Ville,
} from '@rdc/referentiel-domain';

/** Un centre déjà en base, dans le statut voulu (TENETS-TEST-005). */
export function unCentreExistant(
  centreId: CentreId,
  statut: StatutCentre,
): Centre {
  return Centre.reconstituer({
    id: centreId,
    nom: Nom.creer("Centre d'Agen"),
    adresse: Adresse.creer('12 avenue Jean Jaurès'),
    codePostal: CodePostal.creer('47000'),
    ville: Ville.creer('Agen'),
    statut,
    creeLe: new Date('2026-10-01T09:00:00.000Z'),
    modifieLe: new Date('2026-10-01T09:00:00.000Z'),
  });
}
