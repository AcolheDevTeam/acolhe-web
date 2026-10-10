import { adminClinicMutationSchema, createClinicSchema } from '~/schemas/clinic'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, value => createClinicSchema.parse(value))
  return adminClinicMutationSchema.parse(await apiFetch<unknown>(event, '/admin/clinics', { method: 'POST', body }))
})
