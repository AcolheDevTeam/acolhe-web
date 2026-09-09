import { idParamSchema } from '~/schemas/common'
import { patientInvitationResultSchema } from '~/schemas/patient'

// Substitui o token opaco do convite pendente e devolve um link compartilhável.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/patients/${id}/invitation`, {
    method: 'POST',
  })
	return patientInvitationResultSchema.parse(response)
})
