<script setup lang="ts">
import { Search, Sparkles, MapPin } from 'lucide-vue-next';
import { ref, computed } from 'vue';
import { useBookStore } from '~/stores/book';

defineProps<{
  modelValue?: string; // kept for v-model compatibility but we use store
}>();

const emit = defineEmits(['update:modelValue', 'highlight', 'select']);

const store = useBookStore();
const showResults = ref(false);

// Sync store search query
const searchQuery = computed({
  get: () => store.searchQuery,
  set: (val) => store.setSearchQuery(val),
});

// Use store getters
const results = computed(() => {
  if (!searchQuery.value) return [];
  // We can use store.filteredBooks but limit it for dropdown
  const all = store.filteredBooks;
  return all.slice(0, 6);
});

const handleHover = (book: any) => {
  if (book.position) {
    emit('highlight', book.position);
  }
};

const handleLeave = () => {
  emit('highlight', null);
};

const handleSelect = (book: any) => {
  emit('select', book);
  showResults.value = false;
  searchQuery.value = '';
};
</script>

<template>
  <div class="group relative z-50 mx-auto w-full max-w-2xl" @mouseleave="handleLeave">
    <!-- Search Results (Floating Above) -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="showResults && results.length > 0"
        class="absolute right-0 bottom-16 left-0 mb-2 flex flex-wrap justify-center gap-3 rounded-xl border border-stone-200 bg-white/90 p-2 shadow-2xl backdrop-blur-md"
      >
        <div
          v-for="book in results"
          :key="book._id"
          class="group/item relative flex w-20 cursor-pointer flex-col items-center gap-1 transition-all duration-200 hover:-translate-y-1"
          @mouseenter="handleHover(book)"
          @click="handleSelect(book)"
        >
          <!-- Book Cover -->
          <div class="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-stone-100 shadow-sm">
            <img v-if="book.img" :src="book.img" class="h-full w-full object-cover" />
            <div v-else class="flex h-full w-full items-center justify-center bg-stone-200 p-1 text-center text-[8px] text-stone-400">
              No Cover
            </div>
            <!-- Hover Overlay -->
            <div class="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover/item:opacity-100" />
          </div>
          <!-- Title Tooltip-ish -->
          <span class="w-full truncate text-center text-[10px] leading-tight font-medium text-stone-600">
            {{ book.title }}
          </span>

          <!-- Position Indicator if on wall -->
          <div
            v-if="book.position"
            class="absolute -top-1 -right-1 flex items-center rounded-full bg-green-500 px-1 text-[8px] text-white shadow-sm"
          >
            <MapPin class="mr-0.5 h-2 w-2" />
            {{ book.position.row + 1 }}-{{ book.position.col + 1 }}
          </div>
        </div>
      </div>
    </Transition>

    <!-- Input Bar -->
    <div
      class="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
    />
    <div
      class="relative flex h-14 items-center rounded-full border border-stone-200 bg-white/80 px-4 py-2 shadow-lg backdrop-blur-md transition-all focus-within:border-stone-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-stone-400/50"
    >
      <Search class="mr-3 h-5 w-5 text-stone-400" />
      <input
        v-model="searchQuery"
        type="text"
        class="flex-1 bg-transparent text-base text-stone-700 outline-none placeholder:text-stone-400"
        placeholder="搜索书籍标题、作者..."
        @focus="showResults = !!searchQuery && results.length > 0"
      />
      <div class="mx-3 h-6 w-[1px] bg-stone-200" />
      <button
        class="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-purple-600"
        title="AI助手 (Coming Soon)"
      >
        <Sparkles class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>
