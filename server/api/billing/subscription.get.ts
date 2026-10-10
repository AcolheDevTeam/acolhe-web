import { subscriptionSchema } from '~/schemas/billing'

// Assinatura do workspace ativo. Sem assinatura (paciente, conta sem
// organização) a API responde 404; aqui vira `null` para o shell não tratar
// como erro.
export default defineEventHandler(async (event) => {
  try {
    return subscriptionSchema.parse(await apiFetch<unknown>(event, '/billing/subscription'))
  }
  catch (error) {
    if ((error as { statusCode?: number }).statusCode === 404) return null
    throw error
  }
})
