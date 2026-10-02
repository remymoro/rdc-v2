import { MagasinIdInvalide, MagasinIdVide } from '@rdc/referentiel-domain';
import {
  versActiverMagasinCommande,
  versArchiverMagasinCommande,
  versDesactiverMagasinCommande,
} from './cycle-de-vie-magasin.requete';

const identifiant = '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b';

describe.each([
  ['versDesactiverMagasinCommande', versDesactiverMagasinCommande],
  ['versActiverMagasinCommande', versActiverMagasinCommande],
  ['versArchiverMagasinCommande', versArchiverMagasinCommande],
])('%s — paramètre :id → commande (TENETS-ADAPTER-002)', (_, versCommande) => {
  it('construit le MagasinId de la commande', () => {
    expect(versCommande(identifiant).magasinId.valeur).toBe(identifiant);
  });

  it('laisse le domaine refuser un identifiant mal formé', () => {
    expect(() => versCommande('pas-un-uuid')).toThrow(MagasinIdInvalide);
    expect(() => versCommande('   ')).toThrow(MagasinIdVide);
  });
});
