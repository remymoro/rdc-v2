import { NomTropLong, NomVide } from '@rdc/referentiel-domain';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreerCentreRequete,
  versCreerCentreCommande,
} from './creer-centre.requete';

function requete(corps: Record<string, unknown>): CreerCentreRequete {
  return plainToInstance(CreerCentreRequete, corps);
}

const corpsValide = {
  nom: "Centre d'Agen",
  ville: 'Agen',
  codePostal: '47000',
  adresse: '12 avenue Jean Jaurès',
};

describe('CreerCentreRequete — forme de la requête (TENETS-VALIDATE-002)', () => {
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
    const erreurs = await validate(requete({ ...corpsValide, nom: 42 }));
    expect(erreurs.map((e) => e.property)).toContain('nom');
  });

  it('ne duplique pas les règles du domaine : un nom de 500 caractères passe la forme', async () => {
    const erreurs = await validate(
      requete({ ...corpsValide, nom: 'a'.repeat(500) }),
    );
    expect(erreurs).toEqual([]);
  });

  it.each(['telephone', 'email'])(
    'transforme un %s vide ("") en absent (ADR-0007)',
    async (champ) => {
      const r = requete({ ...corpsValide, [champ]: '   ' });
      expect(await validate(r)).toEqual([]);
      expect(r[champ as 'telephone' | 'email']).toBeUndefined();
    },
  );
});

describe('versCreerCentreCommande', () => {
  it('construit les value objects de la commande', () => {
    const commande = versCreerCentreCommande(
      requete({
        ...corpsValide,
        telephone: '05 53 12 34 56',
        email: 'Agen@RestosDuCoeur.org',
      }),
    );

    expect(commande.nom.valeur).toBe("Centre d'Agen");
    expect(commande.adresse.valeur).toBe('12 avenue Jean Jaurès');
    expect(commande.codePostal.valeur).toBe('47000');
    expect(commande.ville.valeur).toBe('Agen');
    expect(commande.telephone?.valeur).toBe('+33553123456');
    expect(commande.email?.valeur).toBe('agen@restosducoeur.org');
  });

  it('laisse téléphone et email absents quand ils ne sont pas fournis', () => {
    const commande = versCreerCentreCommande(requete(corpsValide));

    expect(commande.telephone).toBeUndefined();
    expect(commande.email).toBeUndefined();
  });

  it('laisse le domaine refuser les valeurs invalides', () => {
    expect(() =>
      versCreerCentreCommande(requete({ ...corpsValide, nom: '   ' })),
    ).toThrow(NomVide);
    expect(() =>
      versCreerCentreCommande(
        requete({ ...corpsValide, nom: 'a'.repeat(500) }),
      ),
    ).toThrow(NomTropLong);
  });
});
