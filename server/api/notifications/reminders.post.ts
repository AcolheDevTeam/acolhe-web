import { createReminderSchema } from '~/schemas/notification'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, value => createReminderSchema.parse(value))
  await apiFetch<void>(event, '/notifications/reminders', { method: 'POST', body })
})
