import { z } from 'zod'

const inputSchema = z.object({ email: z.string().trim().email().transform(value => value.toLowerCase()) }).strict()
const resultSchema = z.object({
  email: z.string().email(),
  link: z.string().url(),
  expiresAt: z.string().datetime(),
  deliveryStatus: z.enum(['sent', 'failed', 'disabled']),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, value => inputSchema.parse(value))
  return resultSchema.parse(await apiFetch<unknown>(event, '/admin/invitations', { method: 'POST', body }))
})
