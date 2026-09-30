import { Adresse } from '../commun/adresse';
import { CodePostal } from '../commun/code-postal';
import { Nom } from '../commun/nom';
import { Ville } from '../commun/ville';
import { CleDoublonCentre } from './cle-doublon-centre';

/** Reprend la clé de rapprochement de RDC v1 (NormalizationService). */
describe('CleDoublonCentre', () => {
  function cle(identite: {
    nom: string;
    adresse: string;
    codePostal: string;
    ville: string;
  }): CleDoublonCentre {
    return CleDoublonCentre.depuis({
      nom: Nom.creer(identite.nom),
      adresse: Adresse.creer(identite.adresse),
      codePostal: CodePostal.creer(identite.codePostal),
      ville: Ville.creer(identite.ville),
    });
  }

  const reference = {
    nom: "Centre d'Agen",
    adresse: '12 avenue Jean Jaurès',
    codePostal: '47000',
    ville: 'Agen',
  };

  it.each([
    ['majuscules', { nom: "CENTRE D'AGEN", ville: 'AGEN' }],
    ['accents', { adresse: '12 avenue Jean Jaures' }],
    ['apostrophe typographique', { nom: 'Centre d’Agen' }],
    [
      'tirets et points',
      { nom: 'Centre-d.Agen', adresse: '12 avenue Jean-Jaurès' },
    ],
    ['espaces', { nom: 'Centre d Agen', adresse: '12 avenue JeanJaurès' }],
  ])('est identique malgré les différences de %s', (_cas, variante) => {
    expect(cle({ ...reference, ...variante }).equals(cle(reference))).toBe(
      true,
    );
  });

  it.each([
    ['le nom', { nom: 'Centre de Villeneuve' }],
    ["l'adresse", { adresse: '14 avenue Jean Jaurès' }],
    ['le code postal', { codePostal: '47300' }],
    ['la ville', { ville: 'Villeneuve-sur-Lot' }],
  ])('diffère quand %s change', (_cas, variante) => {
    expect(cle({ ...reference, ...variante }).equals(cle(reference))).toBe(
      false,
    );
  });
});
