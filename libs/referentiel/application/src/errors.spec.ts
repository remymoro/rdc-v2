import { CentreId } from '@rdc/referentiel-domain';
import { CentreIntrouvable } from './errors';

describe('CentreIntrouvable', () => {
  const centreId = CentreId.creer('7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12');

  it('porte le code et le message de RDC v1', () => {
    const erreur = new CentreIntrouvable(centreId);

    expect(erreur).toBeInstanceOf(Error);
    expect(erreur.name).toBe('CentreIntrouvable');
    expect(erreur.code).toBe('CENTRE_NOT_FOUND');
    expect(erreur.message).toBe('Le centre demandé est introuvable.');
  });

  it('garde l’identifiant demandé', () => {
    expect(new CentreIntrouvable(centreId).centreId).toBe(centreId);
  });
});
