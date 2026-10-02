import { CentreIdInvalide, NomVide } from '@rdc/referentiel-domain';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreerMagasinRequete,
  versCreerMagasinCommande,
} from './creer-magasin.requete';

function requete(corps: Record<string, unknown>): CreerMagasinRequete {
  return plainToInstance(CreerMagasinRequete, corps);
}

const centreId = '7f1c9d7e-2d4b-4f7a-9c1e-3b8a5d6e0f12';
const corpsValide = {
  nom: 'Leclerc Agen Sud',
  ville: 'Agen',
  codePostal: '47000',
  adresse: '1 avenue du Général de Gaulle',
};

describe('CreerMagasinRequete — forme de la requête (TENETS-VALIDATE-002)', () => {
  it('accepte une requête complète', async () => {
    expect(await validate(requete(corpsValide))).toEqual([]);
  });

  it.each(['nom', 'ville', 'codePostal', 'adresse'])(
    'refuse une requête sans %s',
    async (champ) => {
      const corps: Record<string, unknown> = { ...corpsValide };
      delete corps[champ];

      const erreurs = await validate(requete(corps));

      expect(erreurs.map((e) => e.property)).toContain(champ);
    },
  );

  it('refuse un champ qui n’est pas du texte', async () => {
    const erreurs = await validate(requete({ ...corpsValide, ville: 47 }));

    expect(erreurs.map((e) => e.property)).toContain('ville');
  });

  it.each(['telephone', 'email'])(
    'transforme un %s vide ("") en absent (ADR-0007)',
    async (champ) => {
      const r = requete({ ...corpsValide, [champ]: '' });

      expect(await validate(r)).toEqual([]);
      expect(r[champ as 'telephone' | 'email']).toBeUndefined();
    },
  );
});

describe('versCreerMagasinCommande', () => {
  it('construit les value objects de la commande, centre compris', () => {
    const commande = versCreerMagasinCommande(
      centreId,
      requete({
        ...corpsValide,
        telephone: '05 53 98 76 54',
        email: 'Agen-Sud@Leclerc.fr',
      }),
    );

    expect(commande.centreId.valeur).toBe(centreId);
    expect(commande.nom.valeur).toBe('Leclerc Agen Sud');
    expect(commande.adresse.valeur).toBe('1 avenue du Général de Gaulle');
    expect(commande.codePostal.valeur).toBe('47000');
    expect(commande.ville.valeur).toBe('Agen');
    expect(commande.telephone?.valeur).toBe('+33553987654');
    expect(commande.email?.valeur).toBe('agen-sud@leclerc.fr');
  });

  it('laisse téléphone et email absents quand ils ne sont pas fournis', () => {
    const commande = versCreerMagasinCommande(centreId, requete(corpsValide));

    expect(commande.telephone).toBeUndefined();
    expect(commande.email).toBeUndefined();
  });

  it('laisse le domaine refuser les valeurs invalides', () => {
    expect(() =>
      versCreerMagasinCommande(centreId, requete({ ...corpsValide, nom: ' ' })),
    ).toThrow(NomVide);
    expect(() =>
      versCreerMagasinCommande('pas-un-uuid', requete(corpsValide)),
    ).toThrow(CentreIdInvalide);
  });
});
