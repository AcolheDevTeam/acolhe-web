/** Valida CNPJ numérico ou alfanumérico pelo dígito verificador oficial. */
export function isValidCnpj(value: string): boolean {
  const normalized = value.replace(/[./-]/g, '').toUpperCase()
  if (!/^[0-9A-Z]{12}\d{2}$/.test(normalized) || /^([0-9A-Z])\1{13}$/.test(normalized)) return false

  const checkDigit = (base: string, weights: number[]) => {
    // A Receita Federal define valor ASCII menos 48 para cada posição.
    const sum = [...base].reduce((total, character, index) => total + (character.charCodeAt(0) - 48) * weights[index], 0)
    const remainder = sum % 11
    return remainder < 2 ? 0 : 11 - remainder
  }

  const first = checkDigit(normalized.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const second = checkDigit(normalized.slice(0, 12) + first, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return Number(normalized[12]) === first && Number(normalized[13]) === second
}

export function normalizeCnpj(value: string): string {
  return value.replace(/[./-]/g, '').toUpperCase()
}
