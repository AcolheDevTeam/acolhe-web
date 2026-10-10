import type { H3Event } from 'h3'

// Busca do "Meu prontuário" (ACO-88): o status da API segue para o cliente com
// uma mensagem em português própria de cada caso; 5xx e rede não levam detalhe.
const messages: Record<number, string> = {
  401: 'Sua sessão expirou. Entre novamente para continuar.',
  403: 'Esta área é só para pacientes.',
  404: 'Sessão não encontrada.',
}

export async function patientRecordFetch(event: H3Event, path: string): Promise<unknown> {
  try {
    return await apiFetch<unknown>(event, path)
  }
  catch (error) {
    const status = (error as { statusCode?: number }).statusCode
    if (!status) throw error
    throw createError({
      statusCode: status,
      statusMessage: messages[status] ?? (status >= 500
        ? 'O serviço está indisponível no momento. Tente novamente em instantes.'
        : 'Não foi possível carregar o seu histórico. Tente novamente.'),
    })
  }
}
