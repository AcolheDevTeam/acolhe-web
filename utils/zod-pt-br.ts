import { z } from 'zod'

// Mapa global de mensagens do Zod em português (regra A6 do guia). Mensagens
// específicas definidas no schema continuam tendo prioridade sobre estas.
export const zodPtBrErrorMap: z.ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') return { message: 'Campo obrigatório' }
      return { message: 'Valor inválido' }

    case z.ZodIssueCode.invalid_string:
      switch (issue.validation) {
        case 'email': return { message: 'Informe um e-mail válido' }
        case 'url': return { message: 'Informe um endereço válido' }
        case 'uuid': return { message: 'Selecione uma opção válida' }
        case 'datetime': return { message: 'Informe uma data e hora válidas' }
        case 'date': return { message: 'Informe uma data válida' }
        case 'time': return { message: 'Informe um horário válido' }
        default: return { message: 'Formato inválido' }
      }

    case z.ZodIssueCode.too_small: {
      const min = Number(issue.minimum)
      if (issue.type === 'string') {
        if (min <= 1) return { message: 'Campo obrigatório' }
        return { message: `Informe pelo menos ${min} caracteres` }
      }
      if (issue.type === 'number') return { message: `O valor mínimo é ${min}` }
      if (issue.type === 'array') return { message: min <= 1 ? 'Selecione pelo menos um item' : `Selecione pelo menos ${min} itens` }
      if (issue.type === 'date') return { message: 'Data anterior ao permitido' }
      return { message: 'Valor abaixo do mínimo' }
    }

    case z.ZodIssueCode.too_big: {
      const max = Number(issue.maximum)
      if (issue.type === 'string') return { message: `Use no máximo ${max} caracteres` }
      if (issue.type === 'number') return { message: `O valor máximo é ${max}` }
      if (issue.type === 'array') return { message: `Selecione no máximo ${max} itens` }
      if (issue.type === 'date') return { message: 'Data posterior ao permitido' }
      return { message: 'Valor acima do máximo' }
    }

    case z.ZodIssueCode.invalid_enum_value:
    case z.ZodIssueCode.invalid_literal:
    case z.ZodIssueCode.invalid_union:
    case z.ZodIssueCode.invalid_union_discriminator:
      return { message: 'Selecione uma opção válida' }

    case z.ZodIssueCode.invalid_date:
      return { message: 'Informe uma data válida' }

    case z.ZodIssueCode.not_multiple_of:
      return { message: `Use múltiplos de ${issue.multipleOf}` }

    case z.ZodIssueCode.unrecognized_keys:
      return { message: 'Campos não reconhecidos' }

    case z.ZodIssueCode.custom:
      return { message: issue.message ?? 'Valor inválido' }

    default:
      return { message: ctx.defaultError === 'Invalid input' ? 'Valor inválido' : ctx.defaultError }
  }
}
