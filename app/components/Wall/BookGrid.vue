<script setup lang="ts">
import { computed } from 'vue'
import { ScanBarcode, Lightbulb, Loader2 } from 'lucide-vue-next'
import BookSpine from './BookSpine.vue'
import { Button } from '~/components/ui/button'
import { cn } from '@/lib/utils'
import { useBookStore } from '~/stores/book'

const props = defineProps<{
  activeCell?: { row: number, col: number } | null
}>()

defineEmits(['entry', 'locate'])

const store = useBookStore()

// Use store data directly
const cells = computed(() => store.cells)
const config = computed(() => store.config)
const isLoading = computed(() => store.isLoading)

const isCellActive = (cell: any) => {
   return props.activeCell && props.activeCell.row === cell.row && props.activeCell.col === cell.col
}

const gridStyle = computed(() => {
  if (!config.value) return {}
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${config.value.cols}, minmax(0, 1fr))`,
    gap: '1rem'
  }
})
</script>

<template>
  <div v-if="isLoading && cells.length === 0" class="flex items-center justify-center h-96">
    <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
  </div>
  
  <div v-else-if="config" class="w-full h-full overflow-auto p-6">
    <div 
      class="bg-stone-50 p-4 rounded-xl border shadow-sm mx-auto transition-all duration-300"
      :style="gridStyle"
    >
      <div 
        v-for="cell in cells" 
        :key="cell.id"
        :class="cn(
          'group relative bg-stone-200/50 border-2 border-stone-200 rounded-md transition-all duration-300 hover:border-stone-400 hover:shadow-md min-h-[140px] flex items-end px-2 py-1 overflow-hidden',
          isCellActive(cell) ? 'ring-4 ring-yellow-400/80 shadow-[0_0_40px_rgba(250,204,21,0.6)] z-20 bg-yellow-50/80 border-yellow-400 scale-105' : ''
        )"
        @click="$emit('locate', cell)"
      >
         <!-- Shelf shadow inner -->
         <div class="absolute inset-0 pointer-events-none shadow-[inset_0_0_20px_rgba(0,0,0,0.05)]" />

         <!-- Books -->
         <div class="flex items-end h-full w-full space-x-[1px] z-10 relative">
            <BookSpine v-for="book in cell.books" :key="book._id" :book="book" />
         </div>

         <!-- Hover Actions Overlay -->
         <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px] z-30 cursor-default">
            <span class="text-white/70 text-xs font-mono">{{ cell.row + 1 }} - {{ cell.col + 1 }}</span>
            <div class="flex gap-2">
              <Button 
                size="icon" 
                variant="secondary" 
                class="h-8 w-8 rounded-full hover:bg-white hover:text-primary"
                title="录入书籍"
                @click.stop="$emit('entry', cell)"
              >
                <ScanBarcode class="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                variant="secondary" 
                class="h-8 w-8 rounded-full hover:bg-yellow-100 hover:text-yellow-600"
                title="灯光定位"
                @click.stop="$emit('locate', cell)"
              >
                <Lightbulb class="w-4 h-4" />
              </Button>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>
