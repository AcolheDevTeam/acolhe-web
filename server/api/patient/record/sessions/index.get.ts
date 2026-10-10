import { patientRecordSessionsSchema } from '~/schemas/patient'

// Lista do "Meu prontuário" (ACO-88). Não exige vínculo ativo: a paciente lê o
// próprio prontuário mesmo depois de encerrado o acompanhamento.
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const parsed = patientRecordSessionsSchema.safeParse(await patientRecordFetch(event, '/patient/record/sessions'))
  // Sem logar o erro do Zod: ele pode conter dados da resposta.
  if (!parsed.success)
    throw createError({ statusCode: 502, statusMessage: 'Não foi possível validar o seu histórico de sessões. Tente novamente.' })
  return parsed.data
})
