import { createPatientSchema, patientInvitationSchema, patientSchema } from '~/schemas/patient'
import { z } from 'zod'

// Cria um paciente — valida no servidor (contrato Zod) antes de repassar à API Go.
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => createPatientSchema.parse(b))
	const response = await apiFetch<unknown>(event, '/patients', {
		method: 'POST',
		body,
	})
	const parsed = z.object({ invitation: patientInvitationSchema }).passthrough().parse(response)
	const { invitation: _invitation, ...patientData } = response as Record<string, unknown>
	const patient = patientSchema.parse(patientData)
	const origin = getRequestURL(event).origin
	return { patient, invitation: { id: parsed.invitation.id ?? crypto.randomUUID(), status: 'pending', deliveryStatus: parsed.invitation.deliveryStatus, expiresAt: parsed.invitation.expiresAt }, copyLink: `${origin}/invite/${encodeURIComponent(parsed.invitation.token)}` }
})
