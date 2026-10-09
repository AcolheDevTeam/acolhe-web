// Etapas do cadastro da psicóloga (protótipo "Cadastro"). A divisão é só de
// tela: cada etapa valida os próprios campos antes de avançar e o envio para
// /api/signup continua sendo um só, no fim, com o mesmo payload.
import type { SignupForm } from '~/schemas/signup'

export type SignupField = keyof SignupForm

export const signupSteps = [
  { name: 'Conta', fields: ['fullName', 'email', 'password', 'confirmPassword'] },
  { name: 'CRP', fields: ['crpNumber', 'crpState', 'cpf'] },
  { name: 'Perfil', fields: ['approach'] },
  { name: 'Termos', fields: ['acceptTerms', 'acceptPrivacy'] },
] as const satisfies readonly { name: string, fields: readonly SignupField[] }[]

/** Índice da etapa dona do campo; -1 para campos sem etapa (versões dos termos). */
export function signupStepOf(field: string): number {
  return signupSteps.findIndex((step) => (step.fields as readonly string[]).includes(field))
}

/**
 * Primeira etapa com erro de validação. Serve para voltar o formulário à etapa
 * certa quando o envio final reprova um campo de outra etapa.
 */
export function firstSignupStepWithError(errors: Partial<Record<string, string | undefined>>): number | undefined {
  const steps = Object.entries(errors)
    .filter(([, message]) => !!message)
    .map(([field]) => signupStepOf(field))
    .filter((step) => step >= 0)
  return steps.length ? Math.min(...steps) : undefined
}

// As 24 regiões do Conselho Regional de Psicologia; o value é o que a API espera.
export const crpRegions = [
  { value: '01', name: 'Distrito Federal', uf: 'DF' },
  { value: '02', name: 'Pernambuco', uf: 'PE' },
  { value: '03', name: 'Bahia', uf: 'BA' },
  { value: '04', name: 'Minas Gerais', uf: 'MG' },
  { value: '05', name: 'Rio de Janeiro', uf: 'RJ' },
  { value: '06', name: 'São Paulo', uf: 'SP' },
  { value: '07', name: 'Rio Grande do Sul', uf: 'RS' },
  { value: '08', name: 'Paraná', uf: 'PR' },
  { value: '09', name: 'Goiás', uf: 'GO' },
  { value: '10', name: 'Pará e Amapá', uf: 'PA/AP' },
  { value: '11', name: 'Ceará', uf: 'CE' },
  { value: '12', name: 'Santa Catarina', uf: 'SC' },
  { value: '13', name: 'Paraíba', uf: 'PB' },
  { value: '14', name: 'Mato Grosso do Sul', uf: 'MS' },
  { value: '15', name: 'Alagoas', uf: 'AL' },
  { value: '16', name: 'Espírito Santo', uf: 'ES' },
  { value: '17', name: 'Rio Grande do Norte', uf: 'RN' },
  { value: '18', name: 'Mato Grosso', uf: 'MT' },
  { value: '19', name: 'Sergipe', uf: 'SE' },
  { value: '20', name: 'Amazonas e Roraima', uf: 'AM/RR' },
  { value: '21', name: 'Piauí', uf: 'PI' },
  { value: '22', name: 'Maranhão', uf: 'MA' },
  { value: '23', name: 'Tocantins', uf: 'TO' },
  { value: '24', name: 'Rondônia e Acre', uf: 'RO/AC' },
] as const

// Sem "Outra": gravaria a palavra literal como abordagem.
export const signupApproaches = ['TCC', 'Psicanálise', 'Humanista', 'Sistêmica', 'ACT'] as const
