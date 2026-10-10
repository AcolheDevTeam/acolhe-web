import { z } from 'zod'

// ZIP com os cadernos da autora na clínica que ela deixou (ACO-96). Repassa os
// bytes sem guardar cópia; o erro nunca leva o corpo da resposta.
export default defineEventHandler(async (event) => {
  const organizationId = z.string().uuid().safeParse(getRouterParam(event, 'organizationId'))
  if (!organizationId.success)
    throw createError({ statusCode: 400, statusMessage: 'Clínica inválida.' })
  const zip = await apiFetch<ArrayBuffer>(event, `/documentary/departures/${organizationId.data}/export`, {
    method: 'POST',
    responseType: 'arrayBuffer',
  })
  const today = new Date().toISOString().slice(0, 10)
  setResponseHeaders(event, {
    'Cache-Control': 'private, no-store',
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="registro-documental-${today}.zip"`,
  })
  return Buffer.from(zip)
})
