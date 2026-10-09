import { passwordResetConfirmSchema } from '~/schemas/password-reset'

// Troca a senha pelo token do link (rota pública, sem sessão). O token nunca é
// logado nem persistido: segue direto para a API e morre aqui.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = passwordResetConfirmSchema.safeParse(body)
  if (!parsed.success) {
    const tokenIssue = parsed.error.issues.some(issue => issue.path[0] === 'token')
    // Token fora do formato é indistinguível de link inválido para quem clicou.
    throw createError(tokenIssue
      ? { statusCode: 404, statusMessage: 'Este link de redefinição não é válido ou já foi usado.' }
      : { statusCode: 400, statusMessage: parsed.error.issues[0]?.message ?? 'Senha inválida.' })
  }

  const config = useRuntimeConfig()
  try {
    await $fetch(`${config.apiUrl}/password-reset/confirm`, { method: 'POST', body: parsed.data })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode
    if (statusCode === 400) {
      throw createError({ statusCode: 400, statusMessage: 'A senha precisa ter pelo menos 8 caracteres e no máximo 72 sem acento.' })
    }
    if (statusCode === 404) {
      throw createError({ statusCode: 404, statusMessage: 'Este link de redefinição não é válido ou já foi usado.' })
    }
    if (statusCode === 410) {
      throw createError({ statusCode: 410, statusMessage: 'Este link de redefinição expirou. Peça um novo.' })
    }
    throw createError({ statusCode: 503, statusMessage: 'Não foi possível trocar a senha agora. Tente novamente em instantes.' })
  }
  // A API encerrou as sessões abertas; a deste navegador também deixa de valer.
  deleteCookie(event, 'acolhe_session', { path: '/' })
  setResponseStatus(event, 204)
  return null
})
