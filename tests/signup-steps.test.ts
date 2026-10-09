import { describe, expect, it } from 'vitest'
import { signupPayloadSchema, signupSchema, signupTermsVersion } from '~/schemas/signup'
import { crpRegions, firstSignupStepWithError, signupStepOf, signupSteps } from '~/utils/signup-steps'

describe('etapas do cadastro', () => {
  it('todo campo do formulário pertence a exatamente uma etapa, exceto as versões dos termos', () => {
    const doFormulario = Object.keys(signupSchema.innerType().shape)
    const nasEtapas = signupSteps.flatMap((step) => [...step.fields] as string[])
    expect(new Set(nasEtapas).size).toBe(nasEtapas.length)
    const semEtapa = doFormulario.filter((field) => !nasEtapas.includes(field))
    expect(semEtapa.sort()).toEqual(['privacyVersion', 'termsVersion'])
  })

  it('cada campo aponta para a etapa que o mostra', () => {
    expect(signupStepOf('email')).toBe(0)
    expect(signupStepOf('confirmPassword')).toBe(0)
    expect(signupStepOf('crpState')).toBe(1)
    expect(signupStepOf('approach')).toBe(2)
    expect(signupStepOf('acceptPrivacy')).toBe(3)
    expect(signupStepOf('termsVersion')).toBe(-1)
  })

  it('volta para a primeira etapa com erro e ignora mensagens vazias', () => {
    expect(firstSignupStepWithError({ acceptTerms: 'Aceite os termos para continuar.', crpNumber: 'Informe apenas os números do CRP.' })).toBe(1)
    expect(firstSignupStepWithError({ email: undefined, acceptTerms: 'x' })).toBe(3)
    expect(firstSignupStepWithError({})).toBeUndefined()
  })

  it('a validação de cada etapa reprova só os campos dela', () => {
    const vazio = signupSchema.safeParse({ termsVersion: signupTermsVersion, privacyVersion: signupTermsVersion, acceptTerms: false, acceptPrivacy: false })
    expect(vazio.success).toBe(false)
    if (!vazio.success) {
      const comErro = new Set(vazio.error.issues.map((issue) => String(issue.path[0])))
      // A etapa Perfil só tem campo opcional: nunca bloqueia o avanço.
      expect(signupSteps[2].fields.some((field) => comErro.has(field))).toBe(false)
      for (const index of [0, 1, 3]) {
        expect(signupSteps[index].fields.some((field) => comErro.has(field))).toBe(true)
      }
    }
  })
})

describe('regiões do CRP', () => {
  it('são as 24 regiões, todas aceitas pelo contrato', () => {
    expect(crpRegions).toHaveLength(24)
    for (const region of crpRegions) {
      expect(signupPayloadSchema.shape.crpState.safeParse(region.value).success).toBe(true)
    }
  })
})
