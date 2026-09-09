import { createPatientSchema, createdPatientAPISchema } from '~/schemas/patient'
import type { Patient } from '~/types'

// Cria um paciente — valida no servidor (contrato Zod) antes de repassar à API Go.
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => createPatientSchema.parse(b))
  const response = await apiFetch<unknown>(event, '/patients', {
    method: 'POST',
    body,
    headers: { 'Idempotency-Key': crypto.randomUUID() },
  })
  const patient = createdPatientAPISchema.parse(response)
  const origin = getRequestURL(event).origin

  return {
    ...patient,
    invitation: {
      email: patient.invitation.email,
      expiresAt: patient.invitation.expiresAt,
      deliveryStatus: patient.invitation.deliveryStatus,
      url: `${origin}/invite/${encodeURIComponent(patient.invitation.token)}`,
    },
  } satisfies Patient
})
