import { createPatientSchema, patientInvitationResultSchema } from '~/schemas/patient'

// Cria um paciente — valida no servidor (contrato Zod) antes de repassar à API Go.
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => createPatientSchema.parse(b))
	const response = await apiFetch<unknown>(event, '/patients', {
		method: 'POST',
		body,
	})
	return patientInvitationResultSchema.parse(response)
})
