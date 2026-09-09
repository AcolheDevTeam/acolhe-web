import { signupSchema } from '~/schemas/signup'

// O token fica exclusivamente no cookie HttpOnly; o browser recebe apenas a projeção pública.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = signupSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Dados de cadastro inválidos.' })
  }

  const config = useRuntimeConfig()
  try {
    const result = await $fetch<{
      token: string
      user: unknown
      psychologistId: string
      crpStatus: string
      onboardingStatus: string
      termsVersion: string
    }>(`${config.apiUrl}/signup`, {
      method: 'POST',
      body: parsed.data,
    })

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
    }
  } catch (error: unknown) {
    const statusCode = (error as { response?: { status?: number } }).response?.status
    if (statusCode === 409) {
      throw createError({ statusCode: 409, statusMessage: 'Não foi possível concluir o cadastro.' })
    }
    throw createError({ statusCode: 503, statusMessage: 'Cadastro indisponível. Tente novamente.' })
  }
})
