export default defineEventHandler((event) => {
  deleteCookie(event, 'acolhe_session', { path: '/' })
  return { ok: true }
})
