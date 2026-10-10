import { FieldContextKey, FormContextKey } from "vee-validate"
import { computed, inject } from "vue"
import { FORM_ITEM_INJECTION_KEY } from "./injectionKeys"

export function useFormField() {
  const fieldContext = inject(FieldContextKey)
  const fieldItemContext = inject(FORM_ITEM_INJECTION_KEY)
  const formContext = inject(FormContextKey, undefined)

  if (!fieldContext)
    throw new Error("useFormField should be used within <FormField>")

  const { name, errorMessage, meta } = fieldContext
  const id = fieldItemContext

  // O erro só aparece depois que a pessoa mexeu no campo ou tentou enviar.
  // Sem isso, a validação silenciosa ao montar desenhava "obrigatório" por um
  // quadro ao abrir um formulário e o diálogo pulava de tamanho.
  const error = computed(() => {
    const shown = meta.touched || (formContext?.submitCount.value ?? 0) > 0
    return shown ? errorMessage.value : undefined
  })

  const fieldState = {
    valid: computed(() => meta.valid),
    isDirty: computed(() => meta.dirty),
    isTouched: computed(() => meta.touched),
    error,
  }

  return {
    id,
    name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}
