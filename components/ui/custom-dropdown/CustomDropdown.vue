<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Check, ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

// Dropdown base do projeto: sempre pesquisável (combobox). Substitui o Select
// simples em formulários. Atributos extras (id, aria-*) vão para o botão gatilho,
// então funciona dentro de <FormControl>.
export interface CustomDropdownOption {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  options: CustomDropdownOption[]
  modelValue?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
  contentClass?: HTMLAttributes['class']
}>(), {
  placeholder: 'Selecione',
  searchPlaceholder: 'Pesquisar…',
  emptyText: 'Nenhum resultado encontrado.',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const open = ref(false)

const selected = computed(() => props.options.find(option => option.value === props.modelValue))

function select(option: CustomDropdownOption) {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  open.value = false
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child :disabled="disabled">
      <button
        type="button"
        role="combobox"
        :aria-expanded="open"
        :disabled="disabled"
        v-bind="$attrs"
        :class="cn(
          'flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          !selected && 'text-muted-foreground',
          props.class,
        )"
      >
        <span class="truncate text-start">{{ selected?.label ?? placeholder }}</span>
        <ChevronDown class="size-4 shrink-0 opacity-50" />
      </button>
    </PopoverTrigger>
    <PopoverContent
      align="start"
      :class="cn('w-[--reka-popover-trigger-width] min-w-48 p-0', contentClass)"
    >
      <Command>
        <CommandInput :placeholder="searchPlaceholder" />
        <CommandList>
          <CommandEmpty>{{ emptyText }}</CommandEmpty>
          <CommandGroup>
            <CommandItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              :disabled="option.disabled"
              class="cursor-pointer"
              @select="select(option)"
            >
              <Check
                class="size-4 shrink-0"
                :class="option.value === modelValue ? 'opacity-100' : 'opacity-0'"
              />
              <span class="flex min-w-0 flex-col">
                <span class="truncate">{{ option.label }}</span>
                <span v-if="option.description" class="truncate text-xs text-muted-foreground">
                  {{ option.description }}
                </span>
              </span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
