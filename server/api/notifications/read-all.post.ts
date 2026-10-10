export default defineEventHandler(async (event) => {
  await apiFetch<unknown>(event, '/notifications/read-all', { method: 'POST' })
  return { ok: true }
})
