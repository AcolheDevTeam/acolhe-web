import { z } from 'zod'
import { activeSessionSchema } from '~/schemas/account-settings'

// Aparelhos com sessão aberta (Ajustes › Segurança, ACO-98).
export default defineEventHandler(async (event) => {
  const res = await apiFetch<unknown>(event, '/me/sessions')
  return z.array(activeSessionSchema).parse(res)
})
