<script setup lang="ts">
import { Library } from 'lucide-vue-next'

defineProps<{
  book: {
    title?: string
    img?: string
    [key: string]: any
  }
}>()
</script>

<template>
  <div class="bg-white p-2 rounded-lg shadow-xl border border-stone-200 w-32">
    <div class="aspect-[2/3] bg-stone-100 rounded-md overflow-hidden mb-2 relative shadow-inner">
      <img v-if="book.img" :src="book.img" class="w-full h-full object-cover" />
      <div v-else class="w-full h-full flex items-center justify-center text-stone-300">
        <Library class="w-8 h-8" />
      </div>
    </div>
    <div class="text-[10px] font-medium truncate text-center text-stone-600">{{ book.title }}</div>
  </div>
</template>

