// Tags da revisão (ACO-104): rótulos livres e curtos que só a psicóloga vê. As
// regras repetem as da API (aparar, sem repetir ignorando caixa, até 10 tags de
// até 32 caracteres) para avisar antes de salvar.

export const REVIEW_TAG_LIMITS = { max: 10, maxLength: 32 } as const

// Tamanho em code points, como a API conta (utf8.RuneCountInString): um emoji
// conta 1, não 2.
export function codePointLength(value: string): number {
  return Array.from(value).length
}

// Controle (C0/C1) e formatação/bidi (Cf) não aparecem na tela e podem esconder
// ou inverter texto; a API recusa. Quebra de linha e tab só no comentário; o ZWJ
// passa porque compõe emojis.
export function hasHiddenChars(value: string, allowLineBreaks: boolean): boolean {
  for (const char of value) {
    if (allowLineBreaks && (char === '\n' || char === '\t')) continue
    if (char === '\u200d') continue
    if (/[\p{Cc}\p{Cf}]/u.test(char)) return true
  }
  return false
}

export const HIDDEN_CHARS_COMMENT_MESSAGE = 'O comentário tem caracteres invisíveis ou de controle. Apague-os e tente de novo.'
export const HIDDEN_CHARS_TAG_MESSAGE = 'As tags não podem ter caracteres invisíveis, de controle ou quebra de linha.'

export function normalizeTag(raw: string): string {
  return raw.trim().split(/\s+/).filter(Boolean).join(' ')
}

export function addReviewTag(
  tags: string[],
  raw: string,
  limits: { max: number, maxLength: number } = REVIEW_TAG_LIMITS,
): { tags: string[], error: string | null } {
  if (hasHiddenChars(raw, false)) return { tags, error: HIDDEN_CHARS_TAG_MESSAGE }
  const tag = normalizeTag(raw)
  if (!tag) return { tags, error: null }
  if (codePointLength(tag) > limits.maxLength) {
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
