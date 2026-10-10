import { adminAccountsQuerySchema, adminAccountsSchema } from '~/schemas/clinic'

export default defineEventHandler(async (event) => {
  const query = adminAccountsQuerySchema.parse(getQuery(event))
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  return adminAccountsSchema.parse(await apiFetch<unknown>(event, `/admin/accounts?${params.toString()}`))
})
