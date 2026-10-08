<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
</script>

<template>
  <Button variant="outline" size="sm" disabled aria-label="Exportar prontuário — em breve">
    <Download aria-hidden="true" />
    Exportar
    <span class="text-xs">· Em breve</span>
  </Button>
</template>
