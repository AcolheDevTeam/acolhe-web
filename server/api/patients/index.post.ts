import { createPatientSchema } from '~/schemas/patient'
import type { Patient } from '~/types'

// Cria um paciente — valida no servidor (contrato Zod) antes de repassar à API Go.
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => createPatientSchema.parse(b))
  return await apiFetch<Patient>(event, '/patients', { method: 'POST', body })
})
