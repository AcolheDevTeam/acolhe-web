<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// Lista de tags livres: chips com remover, campo e "Adicionar" (Enter também
// adiciona). Apara, ignora repetidas sem diferenciar caixa e respeita os
// limites; o aviso aparece embaixo, em português.
const props = withDefaults(defineProps<{
  /** Rótulo do campo de nova tag. */
  label: string
  /** Rótulo da lista de tags já adicionadas. */
  listLabel?: string
  placeholder?: string
  max?: number
  maxLength?: number
  disabled?: boolean
}>(), { listLabel: 'Tags adicionadas', placeholder: 'Nova tag', max: REVIEW_TAG_LIMITS.max, maxLength: REVIEW_TAG_LIMITS.maxLength })
const tags = defineModel<string[]>({ required: true })

const draft = ref('')
const error = ref<string | null>(null)
const inputId = useId()
const input = ref<{ $el?: HTMLInputElement } | null>(null)

function add() {
  const result = addReviewTag(tags.value, draft.value, { max: props.max, maxLength: props.maxLength })
  error.value = result.error
  if (result.error) return
  tags.value = result.tags
  draft.value = ''
}

// Depois de remover, o foco volta ao campo: o botão removido some da tela.
function remove(tag: string) {
  tags.value = tags.value.filter(t => t !== tag)
  error.value = null
  void nextTick(() => input.value?.$el?.focus())
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <ul v-if="tags.length" class="flex flex-wrap gap-2" :aria-label="listLabel">
      <li
        v-for="tag in tags"
        :key="tag"
        class="inline-flex h-8 max-w-full items-center gap-1 rounded-full bg-secondary pl-3 pr-1 text-[13px] text-foreground"
      >
        <span class="truncate">{{ tag }}</span>
        <Button
          variant="ghost"
          size="icon-sm"
          class="size-6 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          :aria-label="`Remover tag ${tag}`"
          :disabled="disabled"
          @click="remove(tag)"
        >
          <X class="size-3.5" />
        </Button>
      </li>
    </ul>
    <form class="flex gap-2" @submit.prevent="add">
      <label :for="inputId" class="sr-only">{{ label }}</label>
      <Input
        :id="inputId"
        ref="input"
        v-model="draft"
        :placeholder="placeholder"
        :maxlength="maxLength * 2"
        :disabled="disabled"
        :aria-invalid="!!error"
        class="h-10 min-w-0 flex-1"
        @update:model-value="error = null"
      />
      <Button type="submit" variant="outline" :disabled="disabled || !draft.trim()">Adicionar</Button>
    </form>
    <p v-if="error" class="text-[13px] text-destructive" role="alert">{{ error }}</p>
  </div>
</template>
