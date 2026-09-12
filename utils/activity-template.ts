import type { CustomDropdownOption } from '@/components/ui/custom-dropdown'
import type {
  ActivityTemplateDetail,
  FieldType,
  TemplateFieldInput,
  TemplateFormValues,
  TemplateTypeCode,
} from '~/schemas/activity-template'
import { TEMPLATE_LIMITS } from '~/schemas/activity-template'
import { apiErrorInfo, apiErrorMessage } from './api-error'

// Vocabulário da biblioteca de templates em português (telas 11 e 12 do design).

export const FIELD_TYPE_META: Record<FieldType, { label: string, description: string }> = {
  short_text: { label: 'Texto curto', description: 'Uma linha, até 500 caracteres' },
  long_text: { label: 'Texto longo', description: 'Parágrafos livres' },
  scale: { label: 'Escala', description: 'Um número entre mínimo e máximo, ex.: 1 a 10' },
  single_choice: { label: 'Escolha única', description: 'Só uma opção' },
  multiple_choice: { label: 'Múltipla escolha', description: 'Pode marcar mais de uma' },
  boolean: { label: 'Sim / não', description: 'Uma pergunta fechada' },
  date: { label: 'Data', description: 'Só o dia' },
  datetime: { label: 'Data e hora', description: 'Dia e horário' },
}

export const FIELD_TYPE_OPTIONS: CustomDropdownOption[] = (Object.keys(FIELD_TYPE_META) as FieldType[])
  .map((value) => ({ value, label: FIELD_TYPE_META[value].label, description: FIELD_TYPE_META[value].description }))

export const TEMPLATE_TYPE_META: Record<TemplateTypeCode, string> = {
  record: 'Formulário',
  scale: 'Escala',
  checklist: 'Checklist',
  checkin: 'Check-in',
}

export const TEMPLATE_TYPE_OPTIONS: CustomDropdownOption[] = (Object.keys(TEMPLATE_TYPE_META) as TemplateTypeCode[])
  .map((value) => ({ value, label: TEMPLATE_TYPE_META[value] }))

export function fieldTypeLabel(type: string): string {
  return FIELD_TYPE_META[type as FieldType]?.label ?? type
}

export function templateTypeLabel(code: string): string {
  return TEMPLATE_TYPE_META[code as TemplateTypeCode] ?? code
}

// Opções do filtro por tipo em /templates (ACO-74). "Todos" é o valor vazio.
export const TEMPLATE_TYPE_FILTER_OPTIONS: CustomDropdownOption[] = [
  { value: '', label: 'Todos os tipos' },
  ...(Object.keys(TEMPLATE_TYPE_META) as TemplateTypeCode[])
    .map((value) => ({ value, label: TEMPLATE_TYPE_META[value] })),
]

// Busca por título/descrição e filtro por tipo base. Puro, para ser testável
// sem montar a página.
export function filterTemplates<T extends { title: string, description?: string | null, type: string }>(
  templates: T[],
  { search = '', typeCode = '' }: { search?: string, typeCode?: string },
): T[] {
  const term = search.trim().toLowerCase()
  return templates.filter((template) => {
    if (typeCode && template.type !== typeCode) return false
    if (!term) return true
    return template.title.toLowerCase().includes(term)
      || (template.description ?? '').toLowerCase().includes(term)
  })
}

export function templateOriginLabel(template: { isGlobal: boolean, ownedByMe: boolean }): string {
  if (template.isGlobal) return 'Acolhe'
  return template.ownedByMe ? 'Meu' : 'Da organização'
}

// "4 campos · situação, pensamento, emoção…" como no card da tela 11.
export function summarizeFields(labels: string[], total = labels.length): string {
  const count = total === 1 ? '1 campo' : `${total} campos`
  if (!labels.length) return count
  const shown = labels.slice(0, 3).map((label) => label.replace(/[?.:!]+$/, '').trim().toLowerCase())
  const suffix = labels.length > 3 ? '…' : ''
  return `${count} · ${shown.join(', ')}${suffix}`
}

export function emptyField(fieldType: FieldType): TemplateFieldInput {
  const base: TemplateFieldInput = { label: '', fieldType, required: true }
  switch (fieldType) {
    case 'scale':
      return { ...base, min: 1, max: 10 }
    case 'single_choice':
    case 'multiple_choice':
      return { ...base, options: ['', ''] }
    default:
      return base
  }
}

export function emptyTemplateForm(): TemplateFormValues {
  return { title: '', typeCode: 'record', fields: [] }
}

// Campos sugeridos ao escolher o tipo base ao CRIAR um template (ACO-74). Até
// aqui o tipo base só virava etiqueta no card: os quatro se comportavam igual.
// São sugestões — a psicóloga adiciona, remove e troca o que quiser depois — e
// nunca se aplicam na edição, para não mexer em template já montado.
export function templateTypePreset(typeCode: TemplateTypeCode): TemplateFieldInput[] {
  switch (typeCode) {
    case 'scale':
      return [{
        ...emptyField('scale'),
        label: 'Intensidade',
        min: 1,
        max: 10,
        minLabel: 'leve',
        maxLabel: 'intensa',
      }]
    case 'checklist':
      return [{ ...emptyField('boolean'), label: 'Concluí a tarefa combinada' }]
    case 'checkin':
      // Mesma faixa do check-in de humor que a paciente já usa na home.
      return [{
        ...emptyField('scale'),
        label: 'Como você está se sentindo hoje?',
        min: 1,
        max: 5,
        minLabel: 'muito mal',
        maxLabel: 'muito bem',
      }]
    case 'record':
    default:
      return []
  }
}

// Verdadeiro quando a lista de campos ainda é exatamente o preset de `typeCode`,
// ou seja, a psicóloga não mexeu nela. Só nesse caso trocar o tipo pode
// substituir os campos: caso contrário a troca destruiria trabalho dela.
export function fieldsAreUntouchedPreset(
  fields: TemplateFieldInput[],
  typeCode: TemplateTypeCode,
): boolean {
  if (!fields.length) return true
  const preset = templateTypePreset(typeCode)
  if (fields.length !== preset.length) return false
  return JSON.stringify(fields) === JSON.stringify(preset)
}

// Converte o detalhe da API nos valores iniciais do builder (edição).
export function templateToFormValues(template: ActivityTemplateDetail): TemplateFormValues {
  return {
    title: template.title,
    description: template.description ?? undefined,
    instructions: template.instructions ?? undefined,
    typeCode: template.type as TemplateTypeCode,
    fields: template.fields.map((field) => ({
      label: field.label,
      fieldType: field.fieldType as FieldType,
      required: field.config.required ?? true,
      helpText: field.config.helpText,
      maxLength: field.config.maxLength,
      min: field.config.min,
      max: field.config.max,
      minLabel: field.config.minLabel,
      maxLabel: field.config.maxLabel,
      options: field.config.options,
    })),
  }
}

export function defaultMaxLength(fieldType: FieldType): number | undefined {
  if (fieldType === 'short_text') return TEMPLATE_LIMITS.shortText.default
  if (fieldType === 'long_text') return TEMPLATE_LIMITS.longText.default
  return undefined
}

// Erros da API no builder. Os 400 da biblioteca já vêm em português e apontam o
// campo ("Campo 3: a escala precisa de valor mínimo e máximo"), então esse texto
// é mostrado; os demais status seguem o padrão de apiErrorMessage.
export function templateApiErrorMessage(error: unknown, fallback: string): string {
  const { status, technical } = apiErrorInfo(error)
  // Só o texto da API Go; um 400 do próprio BFF (Zod) vem como JSON e não serve ao usuário.
  if (status === 400 && technical && !/^corpo inválido/i.test(technical) && !/^[[{]/.test(technical.trim())) return technical
  return apiErrorMessage(error, {
    400: 'Confira os campos do template e tente de novo.',
    403: 'Só a autora pode editar este template. Templates da Acolhe são somente leitura.',
    404: 'Template não encontrado. Ele pode ter sido removido.',
    409: 'Este template foi arquivado ou já tem uma versão mais nova. Atualize a página.',
    default: fallback,
  })
}
