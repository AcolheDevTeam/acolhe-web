import { clinicOverviewSchema } from '~/schemas/clinic'

export default defineEventHandler(async (event) => {
  return clinicOverviewSchema.parse(await apiFetch<unknown>(event, '/clinic/overview'))
})
