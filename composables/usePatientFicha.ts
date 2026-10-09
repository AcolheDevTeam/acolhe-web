import type { InjectionKey, Ref } from 'vue'
import type { Patient } from '~/types'

// A ficha (/patients/[id]) é uma rota aninhada: `pages/patients/[id].vue`
// busca a paciente uma vez e mantém cabeçalho e abas montados; as abas
// (`pages/patients/[id]/*`) leem a mesma paciente daqui, sem buscar de novo.
export interface PatientFicha {
  patientId: Readonly<Ref<string>>
  patient: Readonly<Ref<Patient | null | undefined>>
  // Vínculo ativo e a ficha carregada é desta paciente (não a anterior, ainda
  // em tela ao trocar de paciente). Dado clínico só é pedido com isto verdadeiro.
  clinicalAccess: Readonly<Ref<boolean>>
}

const key: InjectionKey<PatientFicha> = Symbol('patient-ficha')

export function providePatientFicha(ficha: PatientFicha) {
  provide(key, ficha)
}

export function usePatientFicha(): PatientFicha {
  const ficha = inject(key)
  if (!ficha) throw new Error('usePatientFicha só funciona dentro de pages/patients/[id].vue')
  return ficha
}
