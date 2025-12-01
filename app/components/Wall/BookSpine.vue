<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  book: {
    title?: string
    isbn?: string
    _id?: string
    [key: string]: any
  }
  class?: string
}

const props = defineProps<Props>()

// Generate a consistent color based on title
const spineColor = computed(() => {
  const colors = [
    'bg-red-900', 'bg-red-800', 
    'bg-blue-900', 'bg-blue-800', 
    'bg-green-900', 'bg-green-800', 
    'bg-amber-900', 'bg-amber-800', 
    'bg-slate-800', 'bg-slate-700', 
    'bg-stone-800', 'bg-stone-700',
    'bg-indigo-900', 'bg-purple-900'
  ]
  // Simple hash
  let hash = 0;
  const str = props.book.title || 'Unknown';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length
  return colors[index]
})

// Random width for realistic spine look (between w-6 and w-10)
const widthClass = computed(() => {
   const widths = ['w-6', 'w-7', 'w-8', 'w-9']
   let hash = 0;
   const str = props.book.title || 'Unknown';
   for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
   }
   return widths[Math.abs(hash) % widths.length]
})
</script>

<template>
  <div
    :class="cn(
      'h-[95%] border-r border-white/10 shadow-md flex items-center justify-center overflow-hidden relative transition-all duration-200 hover:scale-110 hover:z-20 hover:-translate-y-2 rounded-sm',
      spineColor,
      widthClass,
      props.class
    )"
  >
    <span 
      class="text-[10px] leading-tight text-white/90 font-serif truncate select-none py-2 opacity-90 font-medium tracking-wider"
      style="writing-mode: vertical-rl; text-orientation: mixed;"
    >
      {{ book.title }}
    </span>
    
    <!-- Decorative spine details -->
    <div class="absolute bottom-4 left-0 right-0 h-[1px] bg-white/20" />
    <div class="absolute top-4 left-0 right-0 h-[1px] bg-white/20" />
  </div>
</template>

