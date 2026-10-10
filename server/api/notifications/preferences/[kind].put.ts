import { notificationKindParamSchema, notificationPreferenceBodySchema, notificationPreferenceSchema } from '~/schemas/notification'

// Salvamento automático de um evento da matriz (os dois canais juntos).
export default defineEventHandler(async (event) => {
  const { kind } = await getValidatedRouterParams(event, value => notificationKindParamSchema.parse(value))
  const body = await readValidatedBody(event, value => notificationPreferenceBodySchema.parse(value))
  const response = await apiFetch<unknown>(event, `/notifications/preferences/${kind}`, { method: 'PUT', body })
  return notificationPreferenceSchema.parse(response)
})
