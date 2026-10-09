import { passwordResetRequestResponseSchema, passwordResetRequestSchema, passwordResetSentMessage } from '~/schemas/password-reset'

// Pede o link de redefinição (rota pública). A resposta é sempre a mesma,
// exista a conta ou não — a API garante isso e o BFF não pode estragar a
// propriedade devolvendo erros diferentes por e-mail.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = passwordResetRequestSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Informe um e-mail válido.' })
  }

  const config = useRuntimeConfig()
  try {
    const response = await $fetch<unknown>(`${config.apiUrl}/password-reset`, {
      method: 'POST',
      body: { email: parsed.data.email },
    })
    passwordResetRequestResponseSchema.parse(response)
  } catch {
    // Falha de infraestrutura real: aqui não há o que esconder, é 503 honesto.
    throw createError({ statusCode: 503, statusMessage: 'Não foi possível enviar o link agora. Tente novamente em instantes.' })
  }
  setResponseStatus(event, 202)
  return { message: passwordResetSentMessage }
})
