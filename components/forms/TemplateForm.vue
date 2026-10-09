<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { Plus } from 'lucide-vue-next'
import { useFieldArray, useForm } from 'vee-validate'
import type { FieldType, TemplateFieldInput, TemplateFormValues, TemplateRequest, TemplateTypeCode } from '~/schemas/activity-template'
import { templateRequestSchema } from '~/schemas/activity-template'
import { CustomDropdown } from '@/components/ui/custom-dropdown'
import { EmptyState } from '@/components/ui/empty-state'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

// Builder de template (protótipo "Builder"), usado para criar e editar: nome e
// instrução no topo; tipos de campo à esquerda, campos no meio, configurações e
// "Como a paciente vê" à direita. A página dona controla cabeçalho e
// navegação; o botão de envio pode ficar fora do formulário usando
// `form="template-form"`.
const props = defineProps<{
  initial: TemplateFormValues
  readonly?: boolean
  /** Sugere campos ao escolher o tipo base. Só na criação (ACO-74). */
  presets?: boolean
}>()

const emit = defineEmits<{
  submit: [values: TemplateRequest]
}>()

const { handleSubmit, errors, values } = useForm<TemplateFormValues>({
  validationSchema: toTypedSchema(templateRequestSchema),
  initialValues: props.initial,
})

const { fields, push, remove, move, update, replace } = useFieldArray<TemplateFieldInput>('fields')
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

// Trocar o tipo base sugere os campos daquele tipo, mas só enquanto a lista
// continua sendo o preset anterior (ou está vazia). Se a psicóloga já mexeu nos
// campos, a troca de tipo não encosta neles — trocar de rótulo não pode apagar
// trabalho. Roda só na criação: em edição os campos já existem e são versionados.
const previousType = ref<TemplateTypeCode>(props.initial.typeCode as TemplateTypeCode)

watch(() => values.typeCode as TemplateTypeCode | undefined, (typeCode) => {
  if (!props.presets || props.readonly || !typeCode || typeCode === previousType.value) return
  const current = fields.value.map((field) => field.value)
  if (fieldsAreUntouchedPreset(current, previousType.value)) {
    replace(templateTypePreset(typeCode))
  }
  previousType.value = typeCode
})

const onSubmit = handleSubmit((formValues) => {
  emit('submit', formValues as TemplateRequest)
})

const palette = FIELD_TYPE_OPTIONS.map((option) => ({
  ...option,
  abbr: FIELD_TYPE_META[option.value as FieldType].abbr,
}))
</script>

<template>
  <form id="template-form" class="flex flex-col gap-6" @submit="onSubmit">
    <div class="animate-rise flex flex-col gap-2 [animation-delay:60ms]">
      <FormField v-slot="{ componentField }" name="title">
        <FormItem class="space-y-1.5">
          <FormLabel class="label-mono">Nome do template</FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder="Título do template"
              class="h-auto rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 py-1 text-[26px] font-semibold tracking-[-0.03em] hover:border-transparent focus-visible:border-primary focus-visible:ring-0 md:text-[30px]"
              :disabled="props.readonly"
              v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="instructions">
        <FormItem class="max-w-[720px]">
          <FormLabel class="text-[13px] text-secondary-foreground">Instrução para a paciente <span class="font-normal text-muted-foreground">(opcional)</span></FormLabel>
          <FormControl>
            <Textarea
              placeholder="Ex.: Preencha quando sentir uma emoção forte. Leva uns 5 minutos."
              class="min-h-[72px] text-sm"
              :disabled="props.readonly"
              v-bind="componentField"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>
    </div>

    <!-- Em leitura não há paleta: campos e lateral dividem a largura. -->
    <div
      class="grid gap-6"
      :class="props.readonly
        ? 'lg:grid-cols-[minmax(0,1fr)_19rem]'
        : 'lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_19rem]'"
    >
      <section
        v-if="!props.readonly"
        aria-labelledby="t-tipos"
        class="animate-rise flex flex-col gap-1 [animation-delay:100ms] lg:sticky lg:top-6 lg:self-start"
      >
        <h2 id="t-tipos" class="label-mono mb-2 ml-2.5 font-medium">Adicionar campo</h2>
        <div class="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
          <button
            v-for="option in palette"
            :key="option.value"
            type="button"
            :aria-label="`Adicionar campo ${option.label}`"
            class="group flex h-10 items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 text-sm text-secondary-foreground transition-colors duration-200 hover:border-border hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 lg:w-full lg:border-transparent lg:bg-transparent"
            @click="addField(option.value as FieldType)"
          >
            <span aria-hidden="true" class="flex h-6 min-w-7 items-center justify-center rounded-md bg-accent px-1 font-mono text-[10px] text-success">{{ option.abbr }}</span>
            {{ option.label }}
            <Plus class="ml-auto size-[15px] opacity-0 transition-opacity group-hover:opacity-100 max-lg:hidden" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section
        aria-labelledby="t-campos"
        class="animate-rise flex min-w-0 flex-col gap-3 [animation-delay:140ms]"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="t-campos" class="text-lg font-semibold">Campos <span class="font-mono text-[13px] font-normal text-muted-foreground">{{ fields.length }}</span></h2>
          <span v-if="!props.readonly" class="text-[13px] text-muted-foreground">
            <span class="lg:hidden">Escolha um tipo em “Adicionar campo”</span>
            <span class="max-lg:hidden">Clique em um tipo à esquerda para adicionar</span>
          </span>
        </div>
        <ol v-if="fields.length" class="flex flex-col gap-3">
          <TemplateFieldEditor
            v-for="(field, index) in fields"
            :key="field.key"
            :index="index"
            :total="fields.length"
            :readonly="props.readonly"
            @remove="remove(index)"
            @move="(direction) => move(index, index + direction)"
            @change-type="(fieldType) => changeType(index, fieldType)"
          />
        </ol>
        <EmptyState v-else compact class="rounded-[14px] py-8">
          Nenhum campo ainda. Escolha um tipo em “Adicionar campo”.
        </EmptyState>
        <p v-if="fieldsError" class="text-sm font-medium text-destructive">{{ fieldsError }}</p>
      </section>

      <div
        class="animate-rise flex min-w-0 flex-col gap-5 [animation-delay:180ms]"
        :class="!props.readonly && 'lg:col-start-2 xl:col-start-auto'"
      >
        <section aria-labelledby="t-conf" class="flex flex-col gap-4 rounded-2xl border bg-card p-5">
          <h2 id="t-conf" class="text-base font-semibold">Configurações</h2>
          <FormField v-slot="{ value, handleChange }" name="typeCode">
            <FormItem class="space-y-1.5">
              <FormLabel class="text-[13px] text-secondary-foreground">Tipo base</FormLabel>
              <FormControl>
                <CustomDropdown
                  :options="TEMPLATE_TYPE_OPTIONS"
                  placeholder="Selecione o tipo"
                  search-placeholder="Buscar tipo…"
                  empty-text="Nenhum tipo encontrado."
                  :disabled="props.readonly"
                  :model-value="value ?? ''"
                  class="h-10 rounded-lg bg-card text-sm shadow-none hover:border-input-hover focus:ring-4 focus:ring-primary/15"
                  @update:model-value="handleChange"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <FormField v-slot="{ componentField }" name="description">
            <FormItem class="space-y-1.5">
              <FormLabel class="text-[13px] text-secondary-foreground">Descrição na biblioteca <span class="font-normal text-muted-foreground">(opcional)</span></FormLabel>
              <FormControl>
                <Input type="text" placeholder="Ex.: Situação, pensamento, emoção" class="h-10 text-sm" :disabled="props.readonly" v-bind="componentField" />
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <p class="rounded-lg bg-secondary p-3 text-xs leading-normal text-secondary-foreground">
            Depois de atribuído, editar este template cria uma nova versão. Atividades já enviadas continuam na versão antiga.
          </p>
        </section>

        <TemplatePreview :title="values.title" :instructions="values.instructions" :fields="values.fields ?? []" />
      </div>
    </div>
  </form>
</template>
