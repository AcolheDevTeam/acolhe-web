import { z } from 'zod'
import { adminClinicMutationSchema } from '~/schemas/clinic'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !z.string().uuid().safeParse(id).success) throw createError({ statusCode: 400 })
  return adminClinicMutationSchema.parse(await apiFetch<unknown>(event, `/admin/clinics/${id}/invitation/resend`, { method: 'POST' }))
})
