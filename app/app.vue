<script setup lang="ts">
import { Toaster } from '~/components/ui/sonner'
import { TooltipProvider } from '~/components/ui/tooltip'
import 'vue-sonner/style.css'
</script>

<template>
  <NuxtLayout>
    <!-- 全局 TooltipProvider，只需要一个 -->
    <TooltipProvider>
      <NuxtPage />
    </TooltipProvider>
    <Toaster />
  </NuxtLayout>
</template>
