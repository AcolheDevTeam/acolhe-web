import { signupPayloadSchema } from '~/schemas/signup'
import { z } from 'zod'

const signupResponseSchema = z.object({
  token: z.string().min(1),
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    role: z.string(),
    organizationId: z.string().uuid().nullable(),
  }),
  psychologistId: z.string().uuid(),
  crpStatus: z.literal('pending'),
  onboardingStatus: z.string(),
  termsVersion: z.literal('0.3'),
  privacyVersion: z.literal('0.3'),
})

// O token fica exclusivamente no cookie HttpOnly; o browser recebe apenas a projeção pública.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = signupPayloadSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Dados de cadastro inválidos.' })
  }

  const config = useRuntimeConfig()
  try {
    const response = await $fetch<unknown>(`${config.apiUrl}/signup`, {
      method: 'POST',
      body: parsed.data,
    })
    const result = signupResponseSchema.parse(response)

    setCookie(event, 'acolhe_session', result.token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      secure: !import.meta.dev,
    })

    return {
      user: result.user,
      psychologistId: result.psychologistId,
      crpStatus: result.crpStatus,
      onboardingStatus: result.onboardingStatus,
      termsVersion: result.termsVersion,
      privacyVersion: result.privacyVersion,
    }
  } catch (error: unknown) {
    const statusCode = (error as { response?: { status?: number } }).response?.status
    if (statusCode === 409) {
      throw createError({ statusCode: 409, statusMessage: 'Não foi possível concluir o cadastro.' })
    }
    throw createError({ statusCode: 503, statusMessage: 'Cadastro indisponível. Tente novamente.' })
  }
})
