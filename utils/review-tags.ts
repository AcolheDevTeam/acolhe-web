// Tags da revisão (ACO-104): rótulos livres e curtos que só a psicóloga vê. As
// regras repetem as da API (aparar, sem repetir ignorando caixa, até 10 tags de
// até 32 caracteres) para avisar antes de salvar.

export const REVIEW_TAG_LIMITS = { max: 10, maxLength: 32 } as const

export function normalizeTag(raw: string): string {
  return raw.trim().split(/\s+/).filter(Boolean).join(' ')
}

export function addReviewTag(
  tags: string[],
  raw: string,
  limits: { max: number, maxLength: number } = REVIEW_TAG_LIMITS,
): { tags: string[], error: string | null } {
  const tag = normalizeTag(raw)
  if (!tag) return { tags, error: null }
  if (tag.length > limits.maxLength) {
    return { tags, error: `Cada tag pode ter até ${limits.maxLength} caracteres.` }
  }
  if (tags.some(existing => existing.toLowerCase() === tag.toLowerCase())) {
    return { tags, error: null }
  }
  if (tags.length >= limits.max) {
    return { tags, error: `Use no máximo ${limits.max} tags por atividade.` }
  }
  return { tags: [...tags, tag], error: null }
}

export function sameTags(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((tag, i) => tag === b[i])
}
