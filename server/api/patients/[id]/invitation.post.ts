import type { PatientInvitation } from '~/types'
import { idParamSchema } from '~/schemas/common'
import { patientInvitationAPISchema } from '~/schemas/patient'

// Substitui o token opaco do convite pendente e devolve um link compartilhável.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/patients/${id}/invitation`, {
    method: 'POST',
  })
  const invitation = patientInvitationAPISchema.parse(response)
  const origin = getRequestURL(event).origin

  return {
    email: invitation.email,
    expiresAt: invitation.expiresAt,
    deliveryStatus: invitation.deliveryStatus,
    url: `${origin}/invite/${encodeURIComponent(invitation.token)}`,
  } satisfies PatientInvitation
})
