import { OrdreTri, TriCentres } from '@rdc/referentiel-application';
import { CentreIdInvalide, StatutCentre } from '@rdc/referentiel-domain';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  LireCentresRequete,
  versListerCentresRequete,
  versObtenirCentreRequete,
} from './lire-centres.requete';

function requete(parametres: Record<string, unknown>): LireCentresRequete {
  return plainToInstance(LireCentresRequete, parametres);
}

describe('paramètres des lectures de centres (TENETS-ADAPTER-002)', () => {
  it('accepte une liste sans paramètre', async () => {
    expect(await validate(requete({}))).toEqual([]);
    expect(versListerCentresRequete(requete({}))).toEqual({});
  });

  it.each(['ACTIF', 'INACTIF', 'ARCHIVE'])(
    'accepte le statut %s',
    async (statut) => {
      expect(await validate(requete({ statut }))).toEqual([]);
      expect(versListerCentresRequete(requete({ statut }))).toEqual({
        statut: StatutCentre[statut as keyof typeof StatutCentre],
      });
    },
  );

  it.each(['actif', 'SUPPRIME', ''])(
    'refuse un statut inconnu (%j)',
    async (statut) => {
      const erreurs = await validate(requete({ statut }));
      expect(erreurs.map((e) => e.property)).toEqual(['statut']);
    },
  );

  it('transmet la recherche telle quelle (nettoyée par la requête applicative)', async () => {
    expect(await validate(requete({ recherche: ' agen ' }))).toEqual([]);
    expect(versListerCentresRequete(requete({ recherche: ' agen ' }))).toEqual({
      recherche: ' agen ',
    });
  });

  it('refuse une recherche de plus de 100 caractères', async () => {
    const erreurs = await validate(requete({ recherche: 'a'.repeat(101) }));
    expect(erreurs.map((e) => e.property)).toEqual(['recherche']);
  });

  it('accepte et transmet le tri et l’ordre', async () => {
    const parametres = { tri: 'magasins', ordre: 'desc' };

    expect(await validate(requete(parametres))).toEqual([]);
    expect(versListerCentresRequete(requete(parametres))).toEqual({
      tri: TriCentres.MAGASINS,
      ordre: OrdreTri.DECROISSANT,
    });
  });

  it.each([
    ['tri', 'ville'],
    ['ordre', 'DESC'],
  ])('refuse %s=%s', async (parametre, valeur) => {
    const erreurs = await validate(requete({ [parametre]: valeur }));
    expect(erreurs.map((e) => e.property)).toEqual([parametre]);
  });

  it('construit le CentreId du détail', () => {
    const id = '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12';

    expect(versObtenirCentreRequete(id).centreId.valeur).toBe(id);
    expect(() => versObtenirCentreRequete('x')).toThrow(CentreIdInvalide);
  });
});
