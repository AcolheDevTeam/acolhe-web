import { patientProfileUpdateSchema, patientSettingsProfileSchema } from '~/schemas/patient-settings'

// Correção de nome e telefone pela própria paciente. O e-mail é o login e não
// vai no corpo.
export default defineEventHandler(async (event) => {
  const parsed = patientProfileUpdateSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw createError({
      statusCode: 400,
      statusMessage: issue?.message ?? 'Revise seus dados.',
      data: { field: issue?.path[0] },
    })
  }
  const response = await apiFetch<unknown>(event, '/patient/profile', { method: 'PUT', body: parsed.data })
  return patientSettingsProfileSchema.parse(response)
})
