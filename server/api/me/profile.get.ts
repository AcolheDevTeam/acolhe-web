import { profileSchema } from '~/schemas/account-settings'

// Perfil da psicóloga logada (Ajustes › Perfil, ACO-98).
export default defineEventHandler(async (event) => {
  const res = await apiFetch<unknown>(event, '/me/profile')
  return profileSchema.parse(res)
})
