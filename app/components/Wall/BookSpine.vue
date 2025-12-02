<script setup lang="ts">
import { computed } from 'vue'
import { Library } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '~/components/ui/hover-card'

interface Props {
  book: {
    title?: string
    isbn?: string
    _id?: string
    img?: string
    [key: string]: any
  }
  class?: string
  highlighted?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  click: []
}>()

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

// Random height for realistic spine look (between 85% and 100%)
const heightStyle = computed(() => {
   let hash = 0;
   const str = props.book.title || 'Unknown';
   for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
   }
   const h = 85 + (Math.abs(hash) % 16);
   return { height: `${h}%` }
})

// Width based on pages or random
const computedWidth = computed(() => {
   const pages = parseInt(String(props.book.pages || '').replace(/[^\d]/g, ''), 10);
   if (!isNaN(pages) && pages > 0) {
       // Map pages to pixels: min 16px, max 50px
       const w = Math.min(Math.max(Math.floor(pages / 15), 16), 50);
       return { width: `${w}px` };
   }
   return null;
})

const widthClass = computed(() => {
   if (computedWidth.value) return '';
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
  <HoverCard :open-delay="200" :close-delay="100">
    <HoverCardTrigger as-child>
      <div
        :style="{ ...heightStyle, ...computedWidth }"
        :class="cn(
          'border-r border-white/10 shadow-md flex items-center justify-center overflow-hidden relative transition-all duration-200 hover:scale-110 hover:z-20 hover:-translate-y-2 rounded-sm cursor-pointer',
          spineColor,
          widthClass,
          props.highlighted ? 'ring-2 ring-cyan-400 ring-offset-2 scale-110 z-30 animate-pulse shadow-[0_0_30px_rgba(34,211,238,0.8),0_0_60px_rgba(34,211,238,0.4)]' : '',
          props.class
        )"
        @click="emit('click')"
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
    </HoverCardTrigger>
    
    <HoverCardContent 
      side="top" 
      :side-offset="8"
      class="w-auto p-2"
    >
      <div class="w-32">
        <div class="aspect-[2/3] bg-stone-100 rounded-md overflow-hidden mb-2 relative shadow-inner">
          <img v-if="book.img" :src="book.img" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-stone-300">
            <Library class="w-8 h-8" />
          </div>
        </div>
        <div class="text-[10px] font-medium truncate text-center text-stone-600">
          {{ book.title }}
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
</template>

