/** "" ou espaces → absent : un champ facultatif vide n'est pas renseigné (ADR-0007). */
export function videVersAbsent({ value }: { value: unknown }): unknown {
  return typeof value === 'string' && value.trim().length === 0
    ? undefined
    : value;
}

/** "" ou espaces → null : vider un champ facultatif le supprime (ADR-0007). */
export function videVersSuppression({ value }: { value: unknown }): unknown {
  return typeof value === 'string' && value.trim().length === 0 ? null : value;
}
