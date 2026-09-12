<script setup lang="ts">
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-vue-next'
import { useFieldArray, useFormErrors, useFormValues } from 'vee-validate'
import type { FieldType, TemplateFieldInput, TemplateFormValues } from '~/schemas/activity-template'
import { TEMPLATE_LIMITS } from '~/schemas/activity-template'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

// Um campo do builder (tela 12): número de ordem, tipo de resposta, pergunta,
// texto de apoio, obrigatório e a configuração própria do tipo. Vive dentro do
// formulário de TemplateForm (mesmo contexto do vee-validate), por isso os
// nomes dos campos são `fields[i].…`.
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
</script>

<template>
  <div class="flex flex-col gap-4 rounded-xl border bg-card p-4 md:p-5">
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <span class="label-mono shrink-0 tabular-nums">{{ String(index + 1).padStart(2, '0') }}</span>
        <FormField v-slot="{ value, handleChange }" :name="`${name}.fieldType`">
          <FormItem class="w-full sm:w-56">
            <FormLabel class="sr-only">Tipo de resposta</FormLabel>
            <FormControl>
              <CustomDropdown
                :options="FIELD_TYPE_OPTIONS"
                placeholder="Tipo de resposta"
                search-placeholder="Buscar tipo…"
                empty-text="Nenhum tipo encontrado."
                :disabled="readonly"
                :model-value="value ?? ''"
                @update:model-value="(next) => { handleChange(next); emit('changeType', next as FieldType) }"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>
      <div v-if="!readonly" class="flex shrink-0 items-center gap-1">
        <Button type="button" variant="ghost" size="icon" aria-label="Mover para cima" :disabled="index === 0" @click="emit('move', -1)">
          <ArrowUp />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Mover para baixo" :disabled="index === total - 1" @click="emit('move', 1)">
          <ArrowDown />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Remover campo" @click="emit('remove')">
          <Trash2 />
        </Button>
      </div>
    </div>

    <FormField v-slot="{ componentField }" :name="`${name}.label`">
      <FormItem>
        <FormLabel>Pergunta</FormLabel>
        <FormControl>
          <Input type="text" placeholder="Ex.: Descreva a situação" :disabled="readonly" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <FormField v-slot="{ componentField }" :name="`${name}.helpText`">
      <FormItem>
        <FormLabel>Texto de apoio <span class="text-muted-foreground">(opcional)</span></FormLabel>
        <FormControl>
          <Input type="text" placeholder="Ex.: Quando, onde e com quem aconteceu?" :disabled="readonly" v-bind="componentField" />
        </FormControl>
        <FormMessage />
      </FormItem>
    </FormField>

    <div v-if="isText" class="grid gap-4 sm:grid-cols-2">
      <FormField v-slot="{ componentField }" :name="`${name}.maxLength`">
        <FormItem>
          <FormLabel>Tamanho máximo <span class="text-muted-foreground">(até {{ textLimit }})</span></FormLabel>
          <FormControl>
            <Input type="text" inputmode="numeric" :placeholder="String(defaultMaxLength(fieldType!))" :disabled="readonly" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <div v-if="isScale" class="grid gap-4 sm:grid-cols-2">
      <FormField v-slot="{ componentField }" :name="`${name}.min`">
        <FormItem>
          <FormLabel>Mínimo</FormLabel>
          <FormControl>
            <Input type="text" inputmode="numeric" placeholder="1" :disabled="readonly" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" :name="`${name}.max`">
        <FormItem>
          <FormLabel>Máximo</FormLabel>
          <FormControl>
            <Input type="text" inputmode="numeric" placeholder="10" :disabled="readonly" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" :name="`${name}.minLabel`">
        <FormItem>
          <FormLabel>Rótulo do mínimo <span class="text-muted-foreground">(opcional)</span></FormLabel>
          <FormControl>
            <Input type="text" placeholder="Ex.: nada" :disabled="readonly" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
      <FormField v-slot="{ componentField }" :name="`${name}.maxLabel`">
        <FormItem>
          <FormLabel>Rótulo do máximo <span class="text-muted-foreground">(opcional)</span></FormLabel>
          <FormControl>
            <Input type="text" placeholder="Ex.: muito intensa" :disabled="readonly" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <div v-if="isChoice" class="flex flex-col gap-2">
      <p class="text-sm font-medium">Opções</p>
      <div v-for="(option, optionIndex) in options" :key="option.key" class="flex items-start gap-2">
        <FormField v-slot="{ componentField }" :name="`${name}.options[${optionIndex}]`">
          <FormItem class="flex-1">
            <FormLabel class="sr-only">Opção {{ optionIndex + 1 }}</FormLabel>
            <FormControl>
              <Input type="text" :placeholder="`Opção ${optionIndex + 1}`" :disabled="readonly" v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
        <Button
          v-if="!readonly"
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Remover opção"
          :disabled="!canRemoveOption"
          @click="removeOption(optionIndex)"
        >
          <X />
        </Button>
      </div>
      <p v-if="optionsError" class="text-sm font-medium text-destructive">{{ optionsError }}</p>
      <Button v-if="!readonly" type="button" variant="outline" size="sm" class="self-start" :disabled="!canAddOption" @click="pushOption('')">
        <Plus />
        Adicionar opção
      </Button>
    </div>

    <FormField v-slot="{ value, handleChange }" :name="`${name}.required`">
      <FormItem class="flex items-center gap-2">
        <FormControl>
          <Checkbox
            :id="`${name}-required`"
            :disabled="readonly"
            :model-value="value !== false"
            @update:model-value="(checked) => handleChange(checked === true)"
          />
        </FormControl>
        <FormLabel :for="`${name}-required`" class="!mt-0 font-normal">Resposta obrigatória</FormLabel>
      </FormItem>
    </FormField>
  </div>
</template>
