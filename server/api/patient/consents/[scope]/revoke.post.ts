import { consentScopeParamSchema } from '~/schemas/patient-settings'

export default defineEventHandler(async (event) => {
  const { scope } = await getValidatedRouterParams(event, value => consentScopeParamSchema.parse(value))
  await apiFetch<unknown>(event, `/patient/consents/${scope}/revoke`, { method: 'POST' })
  return { ok: true }
})
