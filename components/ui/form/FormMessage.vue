<script lang="ts" setup>
import { useFormField } from "./useFormField"

// Mesma regra de exibição do useFormField: só depois de tocar ou enviar.
const { error, formMessageId } = useFormField()
</script>

<template>
  <p
    v-if="error"
    :id="formMessageId"
    class="text-[0.8rem] font-medium text-destructive"
  >
    {{ error }}
  </p>
</template>
