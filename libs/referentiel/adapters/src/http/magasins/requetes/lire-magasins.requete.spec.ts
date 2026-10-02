import { CentreIdInvalide, MagasinIdInvalide } from '@rdc/referentiel-domain';
import {
  versListerMagasinsDuCentreRequete,
  versObtenirMagasinRequete,
} from './lire-magasins.requete';

describe('paramètres des lectures de magasins (TENETS-ADAPTER-002)', () => {
  it('construit le MagasinId du détail', () => {
    const id = '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b';

    expect(versObtenirMagasinRequete(id).magasinId.valeur).toBe(id);
    expect(() => versObtenirMagasinRequete('x')).toThrow(MagasinIdInvalide);
  });

  it('construit le CentreId de la liste d’un centre', () => {
    const id = '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12';

    expect(versListerMagasinsDuCentreRequete(id).centreId.valeur).toBe(id);
    expect(() => versListerMagasinsDuCentreRequete('x')).toThrow(
      CentreIdInvalide,
    );
  });
});
