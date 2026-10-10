import { z } from 'zod'
import { newPasswordSchema } from '~/schemas/password'

const paramsSchema = z.object({ token: z.string().min(1).max(512) })
const bodySchema = z.object({ password: newPasswordSchema }).strict()
const resultSchema = z.object({ userId: z.string().uuid() })

// Endpoint público de aceite: encaminha os dados do cliente sem incluir o cookie
// de sessão local na chamada à API.
export default defineEventHandler(async (event) => {
  const { token } = paramsSchema.parse(getRouterParams(event))
  const body = await readValidatedBody(event, value => bodySchema.parse(value))
  const config = useRuntimeConfig()
  try {
    const response = await $fetch<unknown>(`${config.apiUrl}/platform-invitations/${encodeURIComponent(token)}/accept`, {
      method: 'POST',
      body,
      headers: clientHeaders(event),
    })
    return resultSchema.parse(response)
  }
  catch (error) {
    throw relayApiError(error)
  }
})
