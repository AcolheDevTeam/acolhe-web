// Documentos emitidos (ACO-100): rótulos, filtros, máscaras e o texto da
// pré-visualização. O texto espelha o que o worker da API imprime no PDF.
import type { ClinicalDocument } from '~/types'
import { isValidCpf } from '~/schemas/document'
import type { ApiErrorOverrides } from './api-error'
import { zonedParts } from './timezone'

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  declaration: 'Declaração de comparecimento',
  receipt: 'Recibo',
}

/** Rótulo curto para tabela e chips. */
export const DOCUMENT_TYPE_SHORT: Record<string, string> = {
  declaration: 'Declaração',
  receipt: 'Recibo',
}

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'declaration' as const, label: 'Declaração de comparecimento', description: 'Datas das sessões em que a paciente compareceu' },
  { value: 'receipt' as const, label: 'Recibo', description: 'Valor recebido pelas sessões' },
]

export const DOCUMENT_TYPE_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'declaration', label: 'Declaração' },
  { value: 'receipt', label: 'Recibo' },
]

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

export interface DocumentFilters {
  search?: string
  type?: string
  patientId?: string
}

/** Filtra por código ou nome da paciente (sem diferenciar acento), tipo e paciente. */
export function filterDocuments(documents: ClinicalDocument[], filters: DocumentFilters): ClinicalDocument[] {
  const query = normalize(filters.search ?? '')
  const compactQuery = query.replace(/[\s-]/g, '')
  return documents.filter((doc) => {
    if (filters.type && doc.type !== filters.type) return false
    if (filters.patientId && doc.patientId !== filters.patientId) return false
    if (!query) return true
    return normalize(doc.code).replace(/-/g, '').includes(compactQuery)
      || normalize(doc.patientName).includes(query)
  })
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const MONTHS_LONG = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

function dayParts(iso: string) {
  const { day, hour, minute } = zonedParts(iso)
  const [year, month, date] = day.split('-').map(Number) as [number, number, number]
  return { year, month, date, hour, minute }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** "9 out 2026" no fuso do app. */
export function formatShortDate(iso: string): string {
  const p = dayParts(iso)
  return `${p.date} ${MONTHS[p.month - 1]} ${p.year}`
}

/** "14:00" no fuso do app. */
export function formatHour(iso: string): string {
  const p = dayParts(iso)
  return `${pad(p.hour)}:${pad(p.minute)}`
}

/** "9 de outubro de 2026" no fuso do app. */
export function formatLongDate(iso: string | Date): string {
  const p = dayParts(typeof iso === 'string' ? iso : iso.toISOString())
  return `${p.date} de ${MONTHS_LONG[p.month - 1]} de ${p.year}`
}

/** Situação do link de download mostrada na lista. */
export function documentLinkLabel(doc: Pick<ClinicalDocument, 'status' | 'linkExpiresAt'>, now: Date = new Date()): { text: string, active: boolean } {
  if (doc.status === 'pending') return { text: 'Gerando…', active: false }
  if (doc.status === 'failed') return { text: 'Não gerado', active: false }
  if (!doc.linkExpiresAt || new Date(doc.linkExpiresAt).getTime() <= now.getTime()) {
    return { text: 'Sem link ativo', active: false }
  }
  const p = dayParts(doc.linkExpiresAt)
  const hour = p.minute ? `${p.hour}h${pad(p.minute)}` : `${p.hour}h`
  return { text: `Válido até ${p.date} ${MONTHS[p.month - 1]}, ${hour}`, active: true }
}

// ----- Valor em reais e CPF (campos do recibo) -----

/** Máscara de digitação em reais: só dígitos, os dois últimos são centavos. */
export function maskBrl(input: string): string {
  const digits = input.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10)
  if (!digits) return ''
  return formatCents(Number(digits))
}

/** Centavos a partir do texto do campo ("1.250,00" → 125000). */
export function brlToCents(text: string): number | undefined {
  const digits = text.replace(/\D/g, '')
  if (!digits) return undefined
  return Number(digits)
}

/** "1.250,00" (sem o símbolo). */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100)
}

export function maskCpf(input: string): string {
  const d = input.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

// ----- Pré-visualização -----

export interface DocumentPreviewInput {
  type: 'declaration' | 'receipt'
  patientName: string
  sessionDates: string[]
  city: string
  purpose?: string
  amountCents?: number
  payerName?: string
  payerCpf?: string
  today?: Date
}

export interface DocumentPreview {
  title: string
  body: string
  dates: string[]
  purpose?: string
  placeAndDate: string
}

/** Texto do documento como sai no PDF. Campos vazios viram marcadores entre colchetes. */
export function documentPreview(input: DocumentPreviewInput): DocumentPreview {
  const patient = input.patientName.trim() || '[paciente]'
  const dates = [...input.sessionDates]
    .sort()
    .map(iso => `${formatLongDate(iso)}, às ${formatHour(iso)}`)
  const city = input.city.trim() || '[cidade]'
  const placeAndDate = `${city}, ${formatLongDate(input.today ?? new Date())}.`
  if (input.type === 'declaration') {
    const purpose = input.purpose?.trim()
    return {
      title: 'Declaração de comparecimento',
      body: `Declaro, para os devidos fins, que ${patient} compareceu a sessão de psicoterapia nas datas:`,
      dates,
      purpose: purpose ? `Finalidade: ${purpose}` : undefined,
      placeAndDate,
    }
  }
  const payer = input.payerName?.trim() || patient
  const cpfDigits = input.payerCpf?.replace(/\D/g, '') ?? ''
  const cpf = isValidCpf(cpfDigits) ? `, CPF ${maskCpf(cpfDigits)},` : ''
  const amount = input.amountCents ? `R$ ${formatCents(input.amountCents)}` : 'R$ [valor]'
  return {
    title: 'Recibo',
    body: `Recebi de ${payer}${cpf} a importância de ${amount} referente a sessões de psicoterapia de ${patient} nas datas:`,
    dates,
    placeAndDate,
  }
}

/** Data e hora de uma sessão para a lista de escolha: "9 out 2026" e "14:00". */
export function sessionChoiceLabel(iso: string): { date: string, hour: string } {
  return { date: formatShortDate(iso), hour: formatHour(iso) }
}

// ----- Erros da API (regra A6) -----

export const GENERATE_DOCUMENT_ERRORS: ApiErrorOverrides = {
  400: 'A API recusou alguns dados do documento. Confira as sessões, a cidade e, no recibo, o valor e o CPF.',
  403: 'Só quem tem vínculo ativo com a paciente pode emitir documentos para ela.',
  404: 'Não encontramos esta paciente na sua lista. Ela pode ter sido removida.',
  422: 'Uma das sessões escolhidas não é desta paciente. Recarregue a página e selecione as sessões de novo.',
  503: 'A emissão de documentos está fora do ar agora. Tente de novo em alguns minutos.',
  default: 'Não foi possível emitir o documento. Tente de novo em instantes.',
}

export const DOCUMENT_LINK_ERRORS: ApiErrorOverrides = {
  404: 'Não encontramos este documento. Ele pode ter sido emitido em outro espaço de trabalho.',
  409: 'O PDF ainda não está pronto. Espere a geração terminar e tente de novo.',
  503: 'O download de documentos está fora do ar agora. Tente de novo em alguns minutos.',
  default: 'Não foi possível gerar o link do documento. Tente de novo em instantes.',
}

export const DOCUMENT_LIST_ERRORS: ApiErrorOverrides = {
  403: 'Só psicólogas podem ver documentos emitidos.',
  default: 'Não foi possível carregar os documentos. Recarregue a página.',
}
