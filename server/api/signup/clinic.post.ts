import { clinicSignupPayloadSchema, clinicSignupResponseSchema } from '~/schemas/clinic-signup'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = clinicSignupPayloadSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Dados de cadastro da clínica inválidos.' })

  const config = useRuntimeConfig()
  try {
    const response = await $fetch<unknown>(`${config.apiUrl}/signup/clinic`, {
      method: 'POST', body: parsed.data, headers: clientHeaders(event),
    })
    const result = clinicSignupResponseSchema.parse(response)
    if (result.token) setSessionCookie(event, result.token)
    return { emailStatus: result.emailStatus, verificationDelivery: result.verificationDelivery }
  }
  catch (error: unknown) {
    const status = (error as { response?: { status?: number }, statusCode?: number })?.response?.status
      ?? (error as { statusCode?: number }).statusCode
    if (status === 409) throw createError({ statusCode: 409, statusMessage: 'Este e-mail ou CNPJ já está em uso. Confira os dados ou entre na sua conta.' })
    if (status === 400) throw createError({ statusCode: 400, statusMessage: 'Os dados da clínica não foram aceitos. Confira os campos e tente novamente.' })
    throw createError({ statusCode: 503, statusMessage: 'Não foi possível iniciar o cadastro da clínica agora. Tente novamente.' })
  }
})
