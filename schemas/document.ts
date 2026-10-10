import { z } from 'zod'

// Documentos emitidos pela psicóloga (ACO-100). Só declaração de comparecimento
// e recibo: o atestado psicológico depende de validação do modelo (CFP 06/2019)
// e fica fora até lá.
export const DOCUMENT_TYPES = ['declaration', 'receipt'] as const
export type DocumentType = typeof DOCUMENT_TYPES[number]

/** Confere os dígitos verificadores de um CPF (só números, 11 dígitos). */
export function isValidCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false
  const check = (length: number) => {
    let sum = 0
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  return check(9) === Number(digits[9]) && check(10) === Number(digits[10])
}

// Quebra de linha, tabulação, NUL e caracteres invisíveis (inversão bidi,
// espaço de largura zero) não vão para o PDF. Mesma regra da API (docpdf.Printable): o espaço não separável vira espaço
// comum; qualquer outro separador (tabulação, espaço fino, ideográfico...) é
// recusado junto com os de controle e formatação.
const INVISIBLE = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]|(?! )\p{Zs}/u
export const hasInvisibleChars = (value: string) => INVISIBLE.test(value)
export const normalizeSpaces = (value: unknown) => (typeof value === 'string' ? value.replace(/\u00a0/g, ' ') : value)

const optionalText = (max: number, message: string, invisible: string) =>
  z.preprocess(normalizeSpaces, z.string().trim().max(max, message)
    .refine(value => !hasInvisibleChars(value), invisible)
    .optional().transform(value => value || undefined))

export const generateDocumentSchema = z.object({
  patientId: z.string({ required_error: 'Selecione a paciente' }).uuid('Selecione a paciente'),
  type: z.enum(DOCUMENT_TYPES, { errorMap: () => ({ message: 'Escolha o tipo de documento' }) }),
  sessionIds: z.array(z.string().uuid('Sessão inválida'), { required_error: 'Selecione pelo menos uma sessão' })
    .min(1, 'Selecione pelo menos uma sessão')
    .max(60, 'Selecione no máximo 60 sessões'),
  city: z.preprocess(normalizeSpaces, z.string({ required_error: 'Informe a cidade' }).trim()
    .min(1, 'Informe a cidade')
    .max(80, 'Use no máximo 80 caracteres na cidade')
    .refine(value => !hasInvisibleChars(value), 'A cidade tem caracteres que não podem ir para o documento')),
  purpose: optionalText(200, 'Use no máximo 200 caracteres na finalidade', 'A finalidade tem caracteres que não podem ir para o documento'),
  amountCents: z.number().int('Informe o valor em reais')
    .positive('Informe o valor recebido')
    .max(100_000_000, 'Valor acima do permitido')
    .optional(),
  payerName: optionalText(120, 'Use no máximo 120 caracteres no nome', 'O nome tem caracteres que não podem ir para o documento'),
  payerCpf: z.string()
    .transform(value => value.replace(/\D/g, ''))
    .refine(value => value === '' || value.length === 11, 'O CPF tem 11 dígitos')
    .refine(value => value.length !== 11 || isValidCpf(value), 'CPF inválido. Confira os números')
    .optional()
    .transform(value => value || undefined),
}).superRefine((value, ctx) => {
  if (value.type === 'receipt' && value.amountCents == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['amountCents'], message: 'Informe o valor recebido' })
  }
}).transform((value) => {
  // Cada tipo leva só os campos dele: a finalidade não vai no recibo, e valor
  // e pagador não vão na declaração.
  if (value.type === 'declaration') {
    const { amountCents: _a, payerName: _n, payerCpf: _c, ...rest } = value
    return rest
  }
  const { purpose: _p, ...rest } = value
  return rest
})

export type GenerateDocumentInput = z.input<typeof generateDocumentSchema>
export type GenerateDocumentPayload = z.output<typeof generateDocumentSchema>

export const documentsQuerySchema = z.object({
  patientId: z.string().uuid().optional(),
})
