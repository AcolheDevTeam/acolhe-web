import { departuresSchema } from '~/schemas/documentary'

// Clínicas de onde a psicóloga saiu e cujos cadernos ainda pode baixar (ACO-96).
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return departuresSchema.parse(await apiFetch<unknown>(event, '/documentary/departures'))
})
