import { notificationPreferencesSchema } from '~/schemas/notification'

export default defineEventHandler(async (event) => {
  return notificationPreferencesSchema.parse(await apiFetch<unknown>(event, '/notifications/preferences'))
})
