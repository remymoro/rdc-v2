import { CentreIdInvalide, CentreIdVide } from '@rdc/referentiel-domain';
import {
  versActiverCentreCommande,
  versArchiverCentreCommande,
  versDesactiverCentreCommande,
} from './cycle-de-vie-centre.requete';

const identifiant = '0b8f5c3e-2d4a-4f6b-9c1d-7e8f9a0b1c2d';

describe.each([
  ['versDesactiverCentreCommande', versDesactiverCentreCommande],
  ['versActiverCentreCommande', versActiverCentreCommande],
  ['versArchiverCentreCommande', versArchiverCentreCommande],
])('%s — paramètre :id → commande (TENETS-ADAPTER-002)', (_, versCommande) => {
  it('construit le CentreId de la commande', () => {
    expect(versCommande(identifiant).centreId.valeur).toBe(identifiant);
  });

  it('laisse le domaine refuser un identifiant mal formé', () => {
    expect(() => versCommande('pas-un-uuid')).toThrow(CentreIdInvalide);
    expect(() => versCommande('   ')).toThrow(CentreIdVide);
  });
});
