import { submissionRequestSchema, submissionResponseSchema } from '~/schemas/patient-activity'
import { idParamSchema } from '~/schemas/common'

// Envio final da resposta. O submissionId é gerado na tela e torna o reenvio
// idempotente: repetir a mesma submissão devolve a resposta original.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, (value) => idParamSchema.parse(value))
  const body = await readValidatedBody(event, (value) => submissionRequestSchema.parse(value))
  // Sob /patient e não /activities: o guard de papel da API bloqueia todo o
  // prefixo /activities para pacientes.
  const response = await apiFetch<unknown>(event, `/patient/activities/${id}/responses`, {
    method: 'POST',
    body,
  })
  return submissionResponseSchema.parse(response)
})
