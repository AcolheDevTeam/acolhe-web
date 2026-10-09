import { clinicInvitationResultSchema, inviteMemberSchema } from '~/schemas/clinic'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, value => inviteMemberSchema.parse(value))
  return clinicInvitationResultSchema.parse(await apiFetch<unknown>(event, '/clinic/invitations', { method: 'POST', body }))
})
