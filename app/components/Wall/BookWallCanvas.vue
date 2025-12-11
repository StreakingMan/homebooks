<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { usePixiBookWall } from '~/composables/usePixiBookWall';
import { useBookStore } from '~/stores/book';

defineProps<{
  highlightedBookIds?: string[];
}>();

const emit = defineEmits<{
  'select-book': [book: any];
}>();

const store = useBookStore();

// Container ref for PixiJS canvas
const canvasContainer = ref<HTMLElement | null>(null);

// Store data
const cells = computed(() => store.cells);
const config = computed(() => store.config);
const isLoading = computed(() => store.isLoading);

// Initialize PixiJS
const { init, isInitialized } = usePixiBookWall(canvasContainer, {
  cells,
  config,
  onBookClick: (book) => {
    emit('select-book', book);
  },
  onBookDrop: async (book, newPosition) => {
    await store.updateBookPosition(book._id, newPosition);
  },
});

// Initialize when mounted and config is ready
onMounted(async () => {
  if (config.value) {
    await init();
  }
});

// Re-init when config changes from null to valid
watch(config, async (newConfig, oldConfig) => {
  if (newConfig && !oldConfig && !isInitialized.value) {
    await nextTick(); // Wait for DOM to update (v-else-if to render)
    await init();
  }
});
</script>

<template>
  <!-- Loading state -->
  <div v-if="isLoading && cells.length === 0" class="fixed inset-0 z-0 flex items-center justify-center bg-stone-800">
    <Loader2 class="h-8 w-8 animate-spin text-stone-400" />
  </div>

  <!-- PixiJS Canvas Container - Fullscreen -->
  <div v-else-if="config" ref="canvasContainer" class="fixed inset-0 z-0" />
</template>
