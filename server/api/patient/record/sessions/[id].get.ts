import { patientRecordSessionDetailSchema } from '~/schemas/patient'
import { idParamSchema } from '~/schemas/common'

// Registro de uma sessão do "Meu prontuário" (ACO-88). A API devolve 404 para
// sessão futura, de outra paciente ou id inválido; id malformado nem sai daqui.
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const params = idParamSchema.safeParse(getRouterParams(event))
  if (!params.success)
    throw createError({ statusCode: 404, statusMessage: 'Sessão não encontrada.' })
  const parsed = patientRecordSessionDetailSchema.safeParse(await patientRecordFetch(event, `/patient/record/sessions/${params.data.id}`))
  // Sem logar o erro do Zod: ele pode conter dados da resposta.
  if (!parsed.success)
    throw createError({ statusCode: 502, statusMessage: 'Não foi possível validar o registro desta sessão. Tente novamente.' })
  return parsed.data
})
