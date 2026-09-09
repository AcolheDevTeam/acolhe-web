import { createSessionSchema } from '~/schemas/session'
import type { Session } from '~/types'

// Registra uma sessão — valida no servidor (contrato Zod) antes de repassar à API Go.
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, (b) => createSessionSchema.parse(b))
  return await apiFetch<Session>(event, '/sessions', { method: 'POST', body })
})
