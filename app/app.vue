<script setup lang="ts">
import 'vue-sonner/style.css';
import { Toaster } from '~/components/ui/sonner';
import { TooltipProvider } from '~/components/ui/tooltip';
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
