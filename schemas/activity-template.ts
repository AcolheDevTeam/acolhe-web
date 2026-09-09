import { z } from 'zod'

// Biblioteca de templates (ACO-66). Contrato em acolhe-api/docs/activity-templates.md.
// Os limites abaixo repetem os da API para a validação acontecer antes do envio,
// com mensagens em português (regra A6); a API continua sendo a palavra final.

export const FIELD_TYPES = [
  'short_text', 'long_text', 'scale', 'single_choice',
  'multiple_choice', 'boolean', 'date', 'datetime',
] as const
export type FieldType = typeof FIELD_TYPES[number]

export const TEMPLATE_TYPE_CODES = ['record', 'scale', 'checklist', 'checkin'] as const
export type TemplateTypeCode = typeof TEMPLATE_TYPE_CODES[number]

export const TEMPLATE_LIMITS = {
  title: { min: 2, max: 120 },
  description: 1000,
  instructions: 2000,
  fields: { min: 1, max: 30 },
  label: 200,
  helpText: 300,
  shortText: { max: 500, default: 200 },
  longText: { max: 5000, default: 2000 },
  scaleRange: 100,
  options: { min: 2, max: 20, length: 120 },
} as const

// Campo numérico vindo de <Input>: string vazia vira "não informado".
const optionalInt = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.number({ invalid_type_error: 'Informe um número inteiro' })
    .int('Informe um número inteiro')
    .optional(),
)

const trimmedOptional = (limit: number, name: string) => z.string()
  .trim()
  .max(limit, `${name} pode ter no máximo ${limit} caracteres`)
  .optional()
  .transform((value) => (value ? value : undefined))

export const templateFieldInputSchema = z.object({
  label: z.string({ required_error: 'Informe a pergunta' })
    .trim()
    .min(1, 'Informe a pergunta')
    .max(TEMPLATE_LIMITS.label, `A pergunta pode ter no máximo ${TEMPLATE_LIMITS.label} caracteres`),
  fieldType: z.enum(FIELD_TYPES, { errorMap: () => ({ message: 'Selecione o tipo de resposta' }) }),
  required: z.boolean().default(true),
  helpText: trimmedOptional(TEMPLATE_LIMITS.helpText, 'O texto de apoio'),
  maxLength: optionalInt,
  min: optionalInt,
  max: optionalInt,
  minLabel: trimmedOptional(TEMPLATE_LIMITS.options.length, 'O rótulo'),
  maxLabel: trimmedOptional(TEMPLATE_LIMITS.options.length, 'O rótulo'),
  options: z.array(z.string().trim()).optional(),
}).superRefine((field, ctx) => {
  switch (field.fieldType) {
    case 'short_text':
    case 'long_text': {
      const limit = field.fieldType === 'short_text' ? TEMPLATE_LIMITS.shortText.max : TEMPLATE_LIMITS.longText.max
      if (field.maxLength !== undefined && (field.maxLength < 1 || field.maxLength > limit)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['maxLength'], message: `Use um tamanho entre 1 e ${limit}` })
      }
      break
    }
    case 'scale': {
      if (field.min === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['min'], message: 'Informe o mínimo' })
      }
      if (field.max === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['max'], message: 'Informe o máximo' })
      }
      if (field.min !== undefined && field.max !== undefined) {
        if (field.min >= field.max) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['max'], message: 'O máximo deve ser maior que o mínimo' })
        } else if (field.max - field.min > TEMPLATE_LIMITS.scaleRange) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['max'], message: `A escala pode ter no máximo ${TEMPLATE_LIMITS.scaleRange} pontos` })
        }
      }
      break
    }
    case 'single_choice':
    case 'multiple_choice': {
      const options = (field.options ?? []).map((option) => option.trim())
      if (options.length < TEMPLATE_LIMITS.options.min) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: `Informe pelo menos ${TEMPLATE_LIMITS.options.min} opções` })
      }
      if (options.length > TEMPLATE_LIMITS.options.max) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options'], message: `Informe no máximo ${TEMPLATE_LIMITS.options.max} opções` })
      }
      options.forEach((option, index) => {
        if (!option) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options', index], message: 'Preencha ou remova esta opção' })
        } else if (option.length > TEMPLATE_LIMITS.options.length) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options', index], message: `Cada opção pode ter no máximo ${TEMPLATE_LIMITS.options.length} caracteres` })
        } else if (options.findIndex((other) => other.toLowerCase() === option.toLowerCase()) !== index) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['options', index], message: 'Esta opção está repetida' })
        }
      })
      break
    }
    default:
      break
  }
})

export const templateRequestSchema = z.object({
  title: z.string({ required_error: 'Informe o título' })
    .trim()
    .min(TEMPLATE_LIMITS.title.min, `Informe um título com pelo menos ${TEMPLATE_LIMITS.title.min} caracteres`)
    .max(TEMPLATE_LIMITS.title.max, `O título pode ter no máximo ${TEMPLATE_LIMITS.title.max} caracteres`),
  description: trimmedOptional(TEMPLATE_LIMITS.description, 'A descrição'),
  instructions: trimmedOptional(TEMPLATE_LIMITS.instructions, 'A instrução'),
  typeCode: z.enum(TEMPLATE_TYPE_CODES, { errorMap: () => ({ message: 'Selecione o tipo base' }) }),
  fields: z.array(templateFieldInputSchema)
    .min(TEMPLATE_LIMITS.fields.min, 'Adicione pelo menos um campo')
    .max(TEMPLATE_LIMITS.fields.max, `Um template pode ter no máximo ${TEMPLATE_LIMITS.fields.max} campos`),
})

export type TemplateFieldInput = z.infer<typeof templateFieldInputSchema>
export type TemplateRequest = z.infer<typeof templateRequestSchema>
// Valores do formulário antes da validação (campos numéricos ainda como texto).
export type TemplateFormValues = z.input<typeof templateRequestSchema>

// --- Respostas da API ---

export const templateFieldConfigSchema = z.object({
  required: z.boolean().optional(),
  helpText: z.string().optional(),
  maxLength: z.number().int().optional(),
  min: z.number().int().optional(),
  max: z.number().int().optional(),
  minLabel: z.string().optional(),
  maxLabel: z.string().optional(),
  options: z.array(z.string()).optional(),
}).passthrough()

export const templateFieldSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  label: z.string(),
  fieldType: z.string(),
  displayOrder: z.number().int(),
  config: templateFieldConfigSchema,
})

export const activityTemplateSummarySchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  type: z.string(),
  description: z.string().nullable().optional(),
  instructions: z.string().nullable().optional(),
  version: z.number().int().positive(),
  isGlobal: z.boolean(),
  ownedByMe: z.boolean(),
  fieldCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const activityTemplateDetailSchema = activityTemplateSummarySchema.omit({ fieldCount: true }).extend({
  isArchived: z.boolean(),
  superseded: z.boolean(),
  editable: z.boolean(),
  parentTemplateId: z.string().uuid().nullable().optional(),
  assignmentCount: z.number().int().nonnegative(),
  fields: templateFieldSchema.array(),
})

export type TemplateField = z.infer<typeof templateFieldSchema>
export type ActivityTemplateSummary = z.infer<typeof activityTemplateSummarySchema>
export type ActivityTemplateDetail = z.infer<typeof activityTemplateDetailSchema>
