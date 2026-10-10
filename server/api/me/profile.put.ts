import { profileSchema, profileUpdateSchema } from '~/schemas/account-settings'

// Grava o perfil. O CRP não vai no corpo: não muda por aqui.
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = profileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw createError({
      statusCode: 400,
      statusMessage: issue?.message ?? 'Revise os dados do perfil.',
      data: { field: issue?.path[0] },
    })
  }
  const res = await apiFetch<unknown>(event, '/me/profile', { method: 'PUT', body: parsed.data })
  return profileSchema.parse(res)
})
