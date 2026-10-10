import { createClinicPayloadSchema, createClinicResponseSchema } from '~/schemas/clinic-signup'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = createClinicPayloadSchema.safeParse(body)
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Dados da clínica inválidos.' })
  try {
    return createClinicResponseSchema.parse(await apiFetch<unknown>(event, '/clinics', { method: 'POST', body: parsed.data }))
  }
  catch (error: unknown) {
    const status = (error as { statusCode?: number }).statusCode
    if (status === 409) throw createError({ statusCode: 409, statusMessage: 'Este CNPJ já está vinculado a uma clínica.' })
    if (status === 403) throw createError({ statusCode: 403, statusMessage: 'Sua conta precisa estar verificada para criar uma clínica.' })
    throw error
  }
})
