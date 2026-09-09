<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Plus } from 'lucide-vue-next'
import { useFieldArray, useForm } from 'vee-validate'
import type { FieldType, TemplateFieldInput, TemplateFormValues, TemplateRequest } from '~/schemas/activity-template'
import { templateRequestSchema } from '~/schemas/activity-template'
import { Button } from '@/components/ui/button'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// Builder de template (tela 12 do design), usado para criar e editar. A página
// dona controla cabeçalho e navegação; o botão de envio pode ficar fora do
// formulário usando `form="template-form"`.
const props = defineProps<{
  initial: TemplateFormValues
  readonly?: boolean
}>()

const emit = defineEmits<{
  submit: [values: TemplateRequest]
}>()

const { handleSubmit, errors } = useForm<TemplateFormValues>({
  validationSchema: toTypedSchema(templateRequestSchema),
  initialValues: props.initial,
})

const { fields, push, remove, move, update } = useFieldArray<TemplateFieldInput>('fields')
const fieldsError = computed(() => (errors.value as Record<string, string | undefined>).fields)

function addField(fieldType: FieldType) {
  push(emptyField(fieldType))
}

// Trocar o tipo zera a configuração própria do tipo antigo e mantém o resto.
function changeType(index: number, fieldType: FieldType) {
  const current = fields.value[index]?.value
  update(index, {
    ...emptyField(fieldType),
    label: current?.label ?? '',
    helpText: current?.helpText,
    required: current?.required ?? true,
  })
}

const onSubmit = handleSubmit((values) => {
  emit('submit', values as TemplateRequest)
})
</script>

<template>
  <form id="template-form" class="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]" @submit="onSubmit">
    <aside class="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
      <div class="flex flex-col gap-3">
        <p class="label-mono">Tipo base</p>
        <FormField v-slot="{ value, handleChange }" name="typeCode">
          <FormItem>
            <FormLabel class="sr-only">Tipo base</FormLabel>
            <FormControl>
              <CustomDropdown
                :options="TEMPLATE_TYPE_OPTIONS"
                placeholder="Selecione o tipo"
                search-placeholder="Buscar tipo…"
                empty-text="Nenhum tipo encontrado."
                :disabled="readonly"
                :model-value="value ?? ''"
                @update:model-value="handleChange"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <div v-if="!readonly" class="flex flex-col gap-3">
        <p class="label-mono">Adicionar campo</p>
        <div class="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
          <Button
            v-for="option in FIELD_TYPE_OPTIONS"
            :key="option.value"
            type="button"
            variant="ghost"
            size="sm"
            class="justify-start"
            @click="addField(option.value as FieldType)"
          >
            <Plus />
            {{ option.label }}
          </Button>
        </div>
      </div>
    </aside>

    <div class="flex min-w-0 flex-col gap-6">
      <FormField v-slot="{ componentField }" name="title">
        <FormItem>
          <FormLabel class="sr-only">Título</FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder="Título do template"
              class="h-auto border-0 border-b px-0 font-serif text-2xl shadow-none focus-visible:ring-0 md:text-3xl"
              :disabled="readonly"
              v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="instructions">
        <FormItem>
          <FormLabel>Instrução para a paciente <span class="text-muted-foreground">(opcional)</span></FormLabel>
          <FormControl>
            <Textarea
              placeholder="Ex.: Sempre que sentir uma emoção intensa, descreva a situação, o pensamento e a emoção."
              :disabled="readonly"
              v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="description">
        <FormItem>
          <FormLabel>Descrição na biblioteca <span class="text-muted-foreground">(opcional)</span></FormLabel>
          <FormControl>
            <Input type="text" placeholder="Ex.: Situação, pensamento, emoção e alternativa" :disabled="readonly" v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <section class="flex flex-col gap-3">
        <p class="label-mono">Campos · {{ fields.length }}</p>
        <div v-if="fields.length" class="flex flex-col gap-3">
          <TemplateFieldEditor
            v-for="(field, index) in fields"
            :key="field.key"
            :index="index"
            :total="fields.length"
            :readonly="readonly"
            @remove="remove(index)"
            @move="(direction) => move(index, index + direction)"
            @change-type="(fieldType) => changeType(index, fieldType)"
          />
        </div>
        <p
          v-else
          class="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground"
        >
          Nenhum campo ainda. Escolha um tipo em "Adicionar campo" para começar.
        </p>
        <p v-if="fieldsError" class="text-sm font-medium text-destructive">{{ fieldsError }}</p>
      </section>
    </div>
  </form>
</template>
