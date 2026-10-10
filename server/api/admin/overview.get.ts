import { adminOverviewSchema } from '~/schemas/clinic'

export default defineEventHandler(async (event) => {
  return adminOverviewSchema.parse(await apiFetch<unknown>(event, '/admin/overview'))
})
