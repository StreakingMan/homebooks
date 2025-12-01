<script setup lang="ts">
import { ref, computed } from 'vue'
import { Search, Sparkles, MapPin } from 'lucide-vue-next'
import { useBookStore } from '~/stores/book'

defineProps<{
  modelValue?: string // kept for v-model compatibility but we use store
}>()

const emit = defineEmits(['update:modelValue', 'highlight', 'select'])

const store = useBookStore()
const showResults = ref(false)

// Sync store search query
const searchQuery = computed({
  get: () => store.searchQuery,
  set: (val) => store.setSearchQuery(val)
})

// Use store getters
const results = computed(() => {
    if (!searchQuery.value) return []
    // We can use store.filteredBooks but limit it for dropdown
    const all = store.filteredBooks
    return all.slice(0, 6)
})

const handleHover = (book: any) => {
  if (book.position) {
    emit('highlight', book.position)
  }
}

const handleLeave = () => {
  emit('highlight', null)
}

const handleSelect = (book: any) => {
  emit('select', book)
  showResults.value = false
  searchQuery.value = ''
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto relative group z-50" @mouseleave="handleLeave">
     <!-- Search Results (Floating Above) -->
     <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-2 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-2 opacity-0"
     >
       <div v-if="showResults && results.length > 0" class="absolute bottom-16 left-0 right-0 bg-white/90 backdrop-blur-md shadow-2xl rounded-xl border border-stone-200 p-2 flex flex-wrap gap-3 justify-center mb-2">
          <div 
            v-for="book in results" 
            :key="book._id"
            class="group/item relative w-20 cursor-pointer flex flex-col items-center gap-1 transition-all duration-200 hover:-translate-y-1"
            @mouseenter="handleHover(book)"
            @click="handleSelect(book)"
          >
             <!-- Book Cover -->
             <div class="w-full aspect-[2/3] rounded-md overflow-hidden shadow-sm border border-stone-100 relative">
                <img v-if="book.img" :src="book.img" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full bg-stone-200 flex items-center justify-center text-[8px] text-stone-400 p-1 text-center">
                  No Cover
                </div>
                <!-- Hover Overlay -->
                <div class="absolute inset-0 bg-black/20 opacity-0 group-hover/item:opacity-100 transition-opacity"/>
             </div>
             <!-- Title Tooltip-ish -->
             <span class="text-[10px] text-stone-600 font-medium truncate w-full text-center leading-tight">
               {{ book.title }}
             </span>
             
             <!-- Position Indicator if on wall -->
             <div v-if="book.position" class="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] px-1 rounded-full shadow-sm flex items-center">
               <MapPin class="w-2 h-2 mr-0.5" />
               {{ book.position.row + 1 }}-{{ book.position.col + 1 }}
             </div>
          </div>
       </div>
     </Transition>

     <!-- Input Bar -->
     <div class="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"/>
     <div class="relative bg-white/80 backdrop-blur-md shadow-lg rounded-full border border-stone-200 flex items-center px-4 py-2 h-14 transition-all focus-within:ring-2 focus-within:ring-stone-400/50 focus-within:border-stone-300 focus-within:bg-white">
       <Search class="w-5 h-5 text-stone-400 mr-3" />
       <input 
         v-model="searchQuery"
         type="text" 
         class="flex-1 bg-transparent outline-none text-stone-700 placeholder:text-stone-400 text-base"
         placeholder="搜索书籍标题、作者..."
         @focus="showResults = !!searchQuery && results.length > 0"
       />
       <div class="w-[1px] h-6 bg-stone-200 mx-3"/>
       <button class="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-purple-600 transition-colors" title="AI助手 (Coming Soon)">
         <Sparkles class="w-5 h-5" />
       </button>
     </div>
  </div>
</template>
