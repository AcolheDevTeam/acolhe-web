import { resendVerificationPayloadSchema, resendVerificationResponseSchema } from '~/schemas/verify-email'
import { resendConfirmationMessage } from '~/utils/verify-email'

// Reenvia o link de confirmação (rota pública). A resposta é sempre a mesma,
// exista a conta ou não — a API garante isso e o BFF não pode estragar a
// propriedade devolvendo erros diferentes por e-mail.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = resendVerificationPayloadSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Informe um e-mail válido.' })
  }

  const config = useRuntimeConfig()
  try {
    const response = await $fetch<unknown>(`${config.apiUrl}/signup/verify-email/resend`, {
      method: 'POST',
      body: { email: parsed.data.email },
    })
    resendVerificationResponseSchema.parse(response)
  } catch {
    // Falha de infraestrutura real: aqui não há o que esconder, é 503 honesto.
    throw createError({ statusCode: 503, statusMessage: 'Reenvio indisponível. Tente novamente.' })
  }
  setResponseStatus(event, 202)
  return { message: resendConfirmationMessage }
})
