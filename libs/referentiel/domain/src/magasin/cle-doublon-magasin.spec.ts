import { CentreId } from '../centre/centre-id';
import { Adresse } from '../commun/adresse';
import { CodePostal } from '../commun/code-postal';
import { Nom } from '../commun/nom';
import { Ville } from '../commun/ville';
import { CleDoublonMagasin } from './cle-doublon-magasin';
import { Magasin } from './magasin';
import { MagasinId } from './magasin-id';

/** Même clé de rapprochement que le centre (RDC-REF-001), sans le centre. */
describe('CleDoublonMagasin', () => {
  function cle(identite: {
    nom: string;
    adresse: string;
    codePostal: string;
    ville: string;
  }): CleDoublonMagasin {
    return CleDoublonMagasin.depuis({
      nom: Nom.creer(identite.nom),
      adresse: Adresse.creer(identite.adresse),
      codePostal: CodePostal.creer(identite.codePostal),
      ville: Ville.creer(identite.ville),
    });
  }

  const reference = {
    nom: "Leclerc d'Agen Sud",
    adresse: '1 avenue du Général de Gaulle',
    codePostal: '47000',
    ville: 'Agen',
  };

  it.each([
    ['majuscules', { nom: "LECLERC D'AGEN SUD", ville: 'AGEN' }],
    ['accents', { adresse: '1 avenue du General de Gaulle' }],
    ['apostrophe typographique', { nom: 'Leclerc d’Agen Sud' }],
    ['tirets et points', { nom: 'Leclerc-d.Agen Sud' }],
    ['espaces', { nom: 'Leclerc dAgen  Sud' }],
  ])('est identique malgré les différences de %s', (_cas, variante) => {
    expect(cle({ ...reference, ...variante }).equals(cle(reference))).toBe(
      true,
    );
  });

  it.each([
    ['le nom', { nom: "Leclerc d'Agen Nord" }],
    ["l'adresse", { adresse: '3 avenue du Général de Gaulle' }],
    ['le code postal', { codePostal: '47300' }],
    ['la ville', { ville: 'Villeneuve-sur-Lot' }],
  ])('diffère quand %s change', (_cas, variante) => {
    expect(cle({ ...reference, ...variante }).equals(cle(reference))).toBe(
      false,
    );
  });

  it('ne dépend pas du centre de rattachement : la clé est globale', () => {
    function unMagasin(id: string, centreId: string): Magasin {
      return Magasin.creer(
        {
          id: MagasinId.creer(id),
          nom: Nom.creer(reference.nom),
          adresse: Adresse.creer(reference.adresse),
          codePostal: CodePostal.creer(reference.codePostal),
          ville: Ville.creer(reference.ville),
          centreId: CentreId.creer(centreId),
        },
        new Date('2026-10-01T09:00:00.000Z'),
      );
    }

    const aAgen = unMagasin(
      '3b8a5d6e-0f12-4f7a-9c1e-7f1c9d7e2d4b',
      '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12',
    );
    const aVilleneuve = unMagasin(
      '5c9b6e7f-1a23-4b8c-8d2f-8a2d0e8f3e5c',
      '0b6e3f7a-9c2d-4e1f-8a5b-6c7d8e9f0a1b',
    );

    expect(
      CleDoublonMagasin.depuis(aAgen).equals(
        CleDoublonMagasin.depuis(aVilleneuve),
      ),
    ).toBe(true);
  });
});
