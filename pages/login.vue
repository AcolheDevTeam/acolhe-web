<script setup lang="ts">
import { z } from 'zod'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: toTypedSchema(schema),
})

const [email] = defineField('email')
const [password] = defineField('password')

const onSubmit = handleSubmit(async (values) => {
  await $fetch('/api/login', { method: 'POST', body: values })
  await navigateTo('/dashboard')
})
</script>

<template>
  <main class="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 p-6">
    <h1 class="text-2xl font-semibold">Acolhe</h1>
    <form class="flex flex-col gap-3" @submit="onSubmit">
      <label class="flex flex-col gap-1">
        <span class="text-sm">E-mail</span>
        <input v-model="email" type="email" class="rounded border px-3 py-2" />
        <span v-if="errors.email" class="text-sm text-red-600">{{ errors.email }}</span>
      </label>
      <label class="flex flex-col gap-1">
        <span class="text-sm">Senha</span>
        <input v-model="password" type="password" class="rounded border px-3 py-2" />
        <span v-if="errors.password" class="text-sm text-red-600">{{ errors.password }}</span>
      </label>
      <button type="submit" class="rounded bg-emerald-600 px-4 py-2 text-white">Entrar</button>
    </form>
  </main>
</template>
