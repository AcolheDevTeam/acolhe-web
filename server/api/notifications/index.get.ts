import { notificationListQuerySchema, notificationPageSchema } from '~/schemas/notification'

// Caixa de notificações (ACO-99): ?filter=all|unread e ?before=<id> para a
// página seguinte.
export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, value => notificationListQuerySchema.parse(value))
  return notificationPageSchema.parse(await apiFetch<unknown>(event, '/notifications', { query }))
})
