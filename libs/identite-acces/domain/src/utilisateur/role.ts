/** Ce qu'un utilisateur peut faire : les deux seuls rôles de RDC (D-19). */
export enum Role {
  /** L'administrateur unique du siège : tout le référentiel, toutes les collectes. */
  ADMIN = 'ADMIN',
  /** Le compte d'un centre, partagé par son équipe : son centre seulement. */
  RESPONSABLE_CENTRE = 'RESPONSABLE_CENTRE',
}
