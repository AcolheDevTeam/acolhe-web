import { idParamSchema } from '~/schemas/common'
import { patientInvitationSchema, patientSchema } from '~/schemas/patient'
import { z } from 'zod'

// Substitui o token opaco do convite pendente e devolve um link compartilhável.
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, value => idParamSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/patients/${id}/invitation`, {
    method: 'POST',
  })
	const parsed = z.object({ token: patientInvitationSchema.shape.token, email: patientInvitationSchema.shape.email, expiresAt: patientInvitationSchema.shape.expiresAt, deliveryStatus: z.string().default('sent'), id: z.string().uuid().optional() }).parse(response)
	const patientResponse = await apiFetch<Record<string, unknown>>(event, `/patients/${id}`)
	const { invitation: _oldInvitation, ...patientData } = patientResponse
	const origin = getRequestURL(event).origin
	return { patient: patientSchema.parse(patientData), invitation: { id: parsed.id ?? crypto.randomUUID(), status: 'pending', deliveryStatus: parsed.deliveryStatus, expiresAt: parsed.expiresAt }, copyLink: `${origin}/invite/${encodeURIComponent(parsed.token)}` }
})
