import { patientActivityDetailSchema } from '~/schemas/patient-activity'
import { idParamSchema } from '~/schemas/common'

// Formulário da versão pinada do template, para a paciente responder (ACO-68).
export default defineEventHandler(async (event) => {
  const { id } = await getValidatedRouterParams(event, (value) => idParamSchema.parse(value))
  const response = await apiFetch<unknown>(event, `/patient/activities/${id}`)
  return patientActivityDetailSchema.parse(response)
})
