import { z } from 'zod'
import { cancelClinicSchema } from '~/schemas/clinic'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !z.string().uuid().safeParse(id).success) throw createError({ statusCode: 400 })
  const body = await readValidatedBody(event, value => cancelClinicSchema.parse(value))
  await apiFetch(event, `/admin/clinics/${id}/cancel`, { method: 'POST', body })
  setResponseStatus(event, 204)
  return null
})
