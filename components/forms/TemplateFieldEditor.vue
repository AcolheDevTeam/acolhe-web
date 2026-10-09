<script setup lang="ts">
import { ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-vue-next'
import { useFieldArray, useFormErrors, useFormValues } from 'vee-validate'
import type { FieldType, TemplateFieldInput, TemplateFormValues } from '~/schemas/activity-template'
import { TEMPLATE_LIMITS } from '~/schemas/activity-template'
import { Button } from '@/components/ui/button'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

// Um campo do builder (protótipo "Builder", `.fcard`): número de ordem, tipo de
// resposta, pergunta, texto de ajuda, obrigatório (switch) e a configuração
// própria do tipo. Vive dentro do formulário de TemplateForm (mesmo contexto do
// vee-validate), por isso os nomes dos campos são `fields[i].…`.
const props = defineProps<{
  index: number
  total: number
  readonly?: boolean
}>()

const emit = defineEmits<{
  remove: []
  move: [direction: -1 | 1]
  changeType: [fieldType: FieldType]
}>()

const name = computed(() => `fields[${props.index}]`)
const num = computed(() => props.index + 1)
// Rótulos dos campos no card: 13/500, como no protótipo.
const labelClass = 'text-[13px] text-secondary-foreground'
const values = useFormValues<TemplateFormValues>()
const errors = useFormErrors<TemplateFormValues>()
const current = computed<Partial<TemplateFieldInput>>(() => values.value.fields?.[props.index] ?? {})
const fieldType = computed(() => current.value.fieldType as FieldType | undefined)

const isText = computed(() => fieldType.value === 'short_text' || fieldType.value === 'long_text')
const isScale = computed(() => fieldType.value === 'scale')
const isChoice = computed(() => fieldType.value === 'single_choice' || fieldType.value === 'multiple_choice')
const textLimit = computed(() => fieldType.value === 'short_text' ? TEMPLATE_LIMITS.shortText.max : TEMPLATE_LIMITS.longText.max)

const { fields: options, push: pushOption, remove: removeOption } = useFieldArray<string>(() => `${name.value}.options`)
const optionsError = computed(() => (errors.value as Record<string, string | undefined>)[`${name.value}.options`])
const canAddOption = computed(() => options.value.length < TEMPLATE_LIMITS.options.max)
const canRemoveOption = computed(() => options.value.length > TEMPLATE_LIMITS.options.min)

// Depois de mover, o foco segue a mesma pergunta. Se a seta usada ficou
// desabilitada (chegou ao topo ou ao fim), o foco vai para a outra seta.
const upButton = ref<{ $el: HTMLButtonElement } | null>(null)
const downButton = ref<{ $el: HTMLButtonElement } | null>(null)
async function moveField(direction: -1 | 1) {
  emit('move', direction)
  await nextTick()
  const atEdge = direction === -1 ? props.index === 0 : props.index === props.total - 1
  const target = (direction === -1) !== atEdge ? upButton.value : downButton.value
  target?.$el.focus()
}
</script>

<template>
  <li class="animate-fade flex flex-col gap-3 rounded-[14px] border bg-card p-4 transition-[border-color,box-shadow] duration-200 focus-within:border-selected-border focus-within:shadow-[0_0_0_4px_rgba(64,64,214,.08)]">
    <div class="flex items-center gap-2.5">
      <span class="font-mono text-xs tabular-nums text-muted-foreground">{{ num }}</span>
      <FormField v-slot="{ value, handleChange }" :name="`${name}.fieldType`">
        <FormItem class="min-w-0 space-y-0">
          <FormLabel class="sr-only">Tipo de resposta da pergunta {{ num }}</FormLabel>
          <FormControl>
            <!-- O tipo aparece como etiqueta mono (protótipo) e continua trocável. -->
            <CustomDropdown
              :options="FIELD_TYPE_OPTIONS"
              placeholder="Tipo de resposta"
              search-placeholder="Buscar tipo…"
              empty-text="Nenhum tipo encontrado."
              :disabled="props.readonly"
              :model-value="value ?? ''"
              class="-ml-1.5 h-8 w-auto gap-1.5 rounded-md border-0 bg-transparent px-1.5 shadow-none hover:bg-secondary focus:ring-4 focus:ring-primary/15 disabled:opacity-100"
              content-class="w-64"
              @update:model-value="(next) => { handleChange(next); emit('changeType', next as FieldType) }"
            >
              <template #trigger="{ selected }">
                <span class="truncate font-mono text-[11px] uppercase tracking-[0.1em] text-success">{{ selected?.label ?? 'Tipo de resposta' }}</span>
                <ChevronDown v-if="!props.readonly" class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </template>
            </CustomDropdown>
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <div v-if="!props.readonly" class="ml-auto flex shrink-0 items-center gap-0.5">
        <Button ref="upButton" type="button" variant="ghost" size="icon-sm" class="size-[34px] text-muted-foreground" :aria-label="`Mover pergunta ${num} para cima`" :disabled="index === 0" @click="moveField(-1)">
          <ChevronUp />
        </Button>
        <Button ref="downButton" type="button" variant="ghost" size="icon-sm" class="size-[34px] text-muted-foreground" :aria-label="`Mover pergunta ${num} para baixo`" :disabled="index === total - 1" @click="moveField(1)">
          <ChevronDown />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" class="size-[34px] text-muted-foreground" :aria-label="`Remover pergunta ${num}`" @click="emit('remove')">
          <Trash2 />
        </Button>
      </div>
    </div>

    <FormField v-slot="{ componentField }" :name="`${name}.label`">
      <FormItem class="space-y-1.5">
        <FormLabel :class="labelClass">Pergunta</FormLabel>
        <FormControl>
          <Input type="text" placeholder="Ex.: Descreva a situação" class="h-10 text-sm" :disabled="props.readonly" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" :name="`${name}.helpText`">
      <FormItem class="space-y-1.5">
        <FormLabel :class="labelClass">Texto de ajuda <span class="font-normal text-muted-foreground">(opcional)</span></FormLabel>
        <FormControl>
          <Input type="text" placeholder="Ex.: Quando, onde e com quem aconteceu?" class="h-10 text-sm" :disabled="props.readonly" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <div v-if="isText" class="grid gap-3 sm:grid-cols-2">
      <FormField v-slot="{ componentField }" :name="`${name}.maxLength`">
        <FormItem class="space-y-1.5">
          <FormLabel :class="labelClass">Tamanho máximo <span class="font-normal text-muted-foreground">(até {{ textLimit }})</span></FormLabel>
          <FormControl>
            <Input type="text" inputmode="numeric" :placeholder="String(defaultMaxLength(fieldType!))" class="h-10 text-sm" :disabled="props.readonly" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <div v-if="isScale" class="grid gap-3 sm:grid-cols-2">
      <FormField v-slot="{ componentField }" :name="`${name}.min`">
        <FormItem class="space-y-1.5">
          <FormLabel :class="labelClass">Mínimo</FormLabel>
          <FormControl>
            <Input type="text" inputmode="numeric" placeholder="1" class="h-10 text-sm" :disabled="props.readonly" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" :name="`${name}.max`">
        <FormItem class="space-y-1.5">
          <FormLabel :class="labelClass">Máximo</FormLabel>
          <FormControl>
            <Input type="text" inputmode="numeric" placeholder="10" class="h-10 text-sm" :disabled="props.readonly" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" :name="`${name}.minLabel`">
        <FormItem class="space-y-1.5">
          <FormLabel :class="labelClass">Rótulo do mínimo <span class="font-normal text-muted-foreground">(opcional)</span></FormLabel>
          <FormControl>
            <Input type="text" placeholder="Ex.: nada" class="h-10 text-sm" :disabled="props.readonly" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" :name="`${name}.maxLabel`">
        <FormItem class="space-y-1.5">
          <FormLabel :class="labelClass">Rótulo do máximo <span class="font-normal text-muted-foreground">(opcional)</span></FormLabel>
          <FormControl>
            <Input type="text" placeholder="Ex.: muito intensa" class="h-10 text-sm" :disabled="props.readonly" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <div v-if="isChoice" class="flex flex-col gap-2">
      <p class="font-medium" :class="labelClass">Opções</p>
      <div v-for="(option, optionIndex) in options" :key="option.key" class="flex items-start gap-2">
        <FormField v-slot="{ componentField }" :name="`${name}.options[${optionIndex}]`">
          <FormItem class="flex-1 space-y-1.5">
            <FormLabel class="sr-only">Opção {{ optionIndex + 1 }}</FormLabel>
            <FormControl>
              <Input type="text" :placeholder="`Opção ${optionIndex + 1}`" class="h-10 text-sm" :disabled="props.readonly" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <Button
          v-if="!props.readonly"
          type="button"
          variant="ghost"
          size="icon"
          class="text-muted-foreground"
          :aria-label="`Remover opção ${optionIndex + 1}`"
          :disabled="!canRemoveOption"
          @click="removeOption(optionIndex)"
        >
          <X />
        </Button>
      </div>
      <p v-if="optionsError" class="text-sm font-medium text-destructive">{{ optionsError }}</p>
      <Button v-if="!props.readonly" type="button" variant="outline" size="sm" class="self-start" :disabled="!canAddOption" @click="pushOption('')">
        <Plus />
        Adicionar opção
      </Button>
    </div>

    <FormField v-slot="{ value, handleChange }" :name="`${name}.required`">
      <FormItem class="flex items-center gap-2.5 space-y-0">
        <FormControl>
          <Switch
            :id="`${name}-required`"
            :disabled="props.readonly"
            :model-value="value !== false"
            @update:model-value="(checked) => handleChange(checked === true)"
          />
        </FormControl>
        <FormLabel :for="`${name}-required`" class="font-normal" :class="labelClass">Resposta obrigatória</FormLabel>
      </FormItem>
    </FormField>
  </li>
</template>
