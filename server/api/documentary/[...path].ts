import { z } from 'zod'
import {
  categorySchema,
  documentaryPaginationSchema,
  documentaryPatientsSchema,
  notebooksSchema,
  notebookSchema,
  documentaryHistorySchema,
  versionSchema,
  saveNotebookSchema,
  restoreNotebookSchema,
} from '~/schemas/documentary'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const parts = (getRouterParam(event, 'path') ?? '').split('/')
  const method = getMethod(event)
  const uuid = z.string().uuid()
  let responseSchema: z.ZodTypeAny
  let body: unknown
  let query: Record<string, number> | undefined
  try {
    if (method === 'GET' && parts.length === 1 && parts[0] === 'patients') {
      query = documentaryPaginationSchema.parse(getQuery(event))
      responseSchema = documentaryPatientsSchema
    } else if (parts[0] === 'patients' && parts[1]) {
      uuid.parse(parts[1])
      if (method === 'GET' && parts.length === 2)
        responseSchema = notebooksSchema
      else if (method === 'PUT' && parts.length === 3) {
        categorySchema.parse(parts[2])
        body = saveNotebookSchema.parse(await readBody(event))
        responseSchema = notebookSchema
      } else if (
        method === 'POST' &&
        parts.length === 4 &&
        parts[3] === 'restore'
      ) {
        categorySchema.parse(parts[2])
        body = restoreNotebookSchema.parse(await readBody(event))
        responseSchema = notebookSchema
      } else
        throw createError({
          statusCode: 404,
          statusMessage: 'Rota documental não encontrada.',
        })
    } else if (
      method === 'GET' &&
      parts[0] === 'notebooks' &&
      parts[2] === 'versions'
    ) {
      uuid.parse(parts[1])
      if (parts.length === 3) {
        query = documentaryPaginationSchema.parse(getQuery(event))
        responseSchema = documentaryHistorySchema
      } else if (parts.length === 4) {
        z.coerce.number().int().positive().parse(parts[3])
        responseSchema = versionSchema
      } else
        throw createError({
          statusCode: 404,
          statusMessage: 'Rota documental não encontrada.',
        })
    } else
      throw createError({
        statusCode: 404,
        statusMessage: 'Rota documental não encontrada.',
      })
  } catch (error) {
    if (error instanceof z.ZodError)
      throw createError({
        statusCode: 400,
        statusMessage:
          'Dados documentais inválidos. Confira os campos e o tamanho do texto.',
      })
    throw error
  }
  let response: unknown
  try {
    response = await apiFetch<unknown>(
      event,
      `/documentary/${parts.join('/')}`,
      {
        method: method as 'GET' | 'PUT' | 'POST',
        ...(body !== undefined
          ? { body: body as Record<string, unknown> }
          : {}),
        query,
      },
    )
  } catch (error: unknown) {
    // Não propagar FetchError: options/body podem conter o texto clínico.
    const upstream = error as { statusCode?: number; status?: number }
    const code = upstream.statusCode ?? upstream.status
    const messages: Record<number, string> = {
      400: 'Dados documentais inválidos.',
      401: 'Sua sessão expirou. Entre novamente.',
      403: 'Acesso ou gravação documental não permitido.',
      404: 'Caderno ou versão não encontrado.',
      409: 'O caderno foi atualizado em outra aba.',
      503: 'Não foi possível validar a criptografia documental.',
    }
    const statusCode = code && messages[code] ? code : 502
    throw createError({
      statusCode,
      message:
        messages[statusCode] ??
        'Registro Documental indisponível. Tente novamente.',
    })
  }
  const parsed = responseSchema.safeParse(response)
  // Do not log Zod errors: they can contain private response data.
  if (!parsed.success)
    throw createError({
      statusCode: 502,
      statusMessage:
        'Não foi possível validar o registro documental recebido. Tente novamente.',
    })
  return parsed.data
})
