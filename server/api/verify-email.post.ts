import { verifyEmailPayloadSchema, verifyEmailResponseSchema } from '~/schemas/verify-email'

// Confirma o e-mail do cadastro pelo token do link (rota pública, sem sessão).
// O token nunca é logado nem persistido: segue direto para a API e morre aqui.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = verifyEmailPayloadSchema.safeParse(body)
  if (!parsed.success) {
    // Token fora do formato é indistinguível de link inválido para quem clicou.
    throw createError({ statusCode: 404, statusMessage: 'Link de confirmação inválido.' })
  }

  const config = useRuntimeConfig()
  try {
    const response = await $fetch<unknown>(`${config.apiUrl}/signup/verify-email`, {
      method: 'POST',
      body: parsed.data,
    })
    return verifyEmailResponseSchema.parse(response)
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode === 404) {
      throw createError({ statusCode: 404, statusMessage: 'Link de confirmação inválido.' })
    }
    if (statusCode === 410) {
      throw createError({ statusCode: 410, statusMessage: 'Link de confirmação expirado.' })
    }
    throw createError({ statusCode: 503, statusMessage: 'Confirmação indisponível. Tente novamente.' })
  }
})
