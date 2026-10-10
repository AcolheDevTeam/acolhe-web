import { unreadCountSchema } from '~/schemas/notification'

// Contador do sino.
export default defineEventHandler(async (event) => {
  return unreadCountSchema.parse(await apiFetch<unknown>(event, '/notifications/unread-count'))
})
