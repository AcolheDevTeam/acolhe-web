import { z } from 'zod'
import { clinicInvitationResultSchema } from '~/schemas/clinic'

const params = z.object({ id: z.string().uuid(), action: z.enum(['resend', 'revoke']) })

export default defineEventHandler(async (event) => {
  const { id, action } = await getValidatedRouterParams(event, value => params.parse(value))
  const response = await apiFetch<unknown>(event, `/clinic/invitations/${id}/${action}`, { method: 'POST' })
  if (action === 'revoke') {
    setResponseStatus(event, 204)
    return null
  }
  return clinicInvitationResultSchema.parse(response)
})
