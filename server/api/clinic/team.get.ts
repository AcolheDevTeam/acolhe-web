import { clinicTeamSchema } from '~/schemas/clinic'

export default defineEventHandler(async (event) => {
  return clinicTeamSchema.parse(await apiFetch<unknown>(event, '/clinic/team'))
})
