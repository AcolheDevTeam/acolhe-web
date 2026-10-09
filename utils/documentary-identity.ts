import type { User } from '~/types'

/** Identidade de quem ainda não foi reconhecida (nenhum `/me` válido até agora). */
export const unknownDocumentaryIdentity = ':'

/**
 * Próxima identidade do Registro Documental. Só um usuário válido troca a
 * identidade: `/me` devolve `null` tanto para sessão expirada quanto para falha
 * de rede ou 5xx, e tratar isso como troca de pessoa apagava o rascunho não
 * salvo (ACO-77). Outra pessoa entrando no mesmo navegador continua trocando a
 * identidade e limpando o cache privado.
 */
export function nextDocumentaryIdentity(
  previous: string,
  user: Pick<User, 'id' | 'organizationId'> | null | undefined,
): string {
  if (!user?.id) return previous
  return `${user.organizationId ?? ''}:${user.id}`
}
