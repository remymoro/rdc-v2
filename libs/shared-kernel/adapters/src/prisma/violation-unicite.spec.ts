import { Prisma } from './generated/client';
import { estViolationDUnicite } from './violation-unicite';

describe('estViolationDUnicite', () => {
  function erreurPrisma(code: string) {
    return new Prisma.PrismaClientKnownRequestError('échec', {
      code,
      clientVersion: 'test',
    });
  }

  it('reconnaît une violation de contrainte unique (P2002)', () => {
    expect(estViolationDUnicite(erreurPrisma('P2002'))).toBe(true);
  });

  it.each([
    ['une autre erreur Prisma connue', erreurPrisma('P2003')],
    ['une erreur quelconque', new Error('P2002')],
    ['une valeur qui n’est pas une erreur', { code: 'P2002' }],
  ])('ignore %s', (_cas, erreur) => {
    expect(estViolationDUnicite(erreur)).toBe(false);
  });
});
