import { z } from 'zod'
import { configure } from 'vee-validate'
import { zodPtBrErrorMap } from '~/utils/zod-pt-br'

// Configuração global de validação (roda no servidor e no cliente).
export default defineNuxtPlugin(() => {
  // Toda mensagem do Zod sem texto próprio sai em português.
  z.setErrorMap(zodPtBrErrorMap)

  // Erros só aparecem quando o usuário altera o campo ou submete o formulário.
  // Sem isto, o primeiro campo (autofocado pelo Dialog) acusava erro ao clicar em
  // qualquer lugar do modal, antes de o usuário digitar nada.
  configure({
    validateOnBlur: false,
    validateOnChange: true,
    validateOnInput: false,
    validateOnModelUpdate: true,
  })
})
