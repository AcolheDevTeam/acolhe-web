import { departuresSchema } from '~/schemas/documentary'

// Clínicas de onde a psicóloga saiu e cujos cadernos ainda pode baixar (ACO-96).
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const parsed = departuresSchema.safeParse(await apiFetch<unknown>(event, '/documentary/departures'))
  // Sem logar o erro do Zod: ele pode conter dados da resposta.
  if (!parsed.success)
    throw createError({ statusCode: 502, statusMessage: 'Não foi possível validar os cadernos recebidos. Tente novamente.' })
  return parsed.data
})
