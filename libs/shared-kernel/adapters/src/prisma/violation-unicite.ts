import { Prisma } from './generated/client';

/**
 * Une écriture a violé une contrainte unique (code Prisma P2002). Permet aux
 * repositories de traduire ce seul échec fournisseur connu en erreur de leur
 * port, sans intercepter le reste (TENETS-ERROR-005, ADAPTER-006).
 */
export function estViolationDUnicite(erreur: unknown): boolean {
  return (
    erreur instanceof Prisma.PrismaClientKnownRequestError &&
    erreur.code === 'P2002'
  );
}
