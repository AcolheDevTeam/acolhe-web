import { configure } from 'vee-validate'

// Erros de validação só aparecem quando o usuário altera o campo ou submete o
// formulário. Sem isto, o primeiro campo (autofocado pelo Dialog) acusava erro ao
// clicar em qualquer lugar do modal, antes de o usuário digitar nada.
export default defineNuxtPlugin(() => {
  configure({
    validateOnBlur: false,
    validateOnChange: true,
    validateOnInput: false,
    validateOnModelUpdate: true,
  })
})
