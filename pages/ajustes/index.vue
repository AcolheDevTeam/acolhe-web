<script setup lang="ts">
import type { User } from '~/types'

// /ajustes abre na primeira seção que a pessoa tem: Perfil para quem atende,
// Segurança para quem só administra a clínica.
definePageMeta({
  middleware: ['auth', () => {
    const { data: user } = useNuxtData<User | null>('me')
    if (user.value?.role === 'patient') return navigateTo(homeFor(user.value))
    return navigateTo(user.value?.role === 'psychologist' ? '/ajustes/perfil' : '/ajustes/seguranca', { replace: true })
  }],
})
</script>

<template>
  <div />
</template>
