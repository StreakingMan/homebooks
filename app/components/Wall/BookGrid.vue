<script setup lang="ts">
import BookSpine from './BookSpine.vue';
import { cn } from '@/lib/utils';
import { ScanBarcode, Lightbulb, Loader2 } from 'lucide-vue-next';
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { Button } from '~/components/ui/button';
import { useBookStore } from '~/stores/book';

const props = defineProps<{
  activeCell?: { row: number; col: number } | null;
  highlightedBookIds?: string[];
}>();

defineEmits(['entry', 'locate', 'select-book']);

const store = useBookStore();

// Use store data directly
const cells = computed(() => store.cells);
const config = computed(() => store.config);
const isLoading = computed(() => store.isLoading);

const containerRef = ref<HTMLElement | null>(null);
const contentWidth = ref(0);
const contentHeight = ref(0);

const updateSize = () => {
  if (!config.value) return;

  // Calculate available size based on window viewport
  // Horizontal: main padding (p-4=32px) + grid container padding (p-2=16px)
  const xPadding = 48;
  // Vertical: TopBar (pt-16=64px) + ChatBar area (pb-24=96px) + extra buffer
  const yPadding = 180;

  const availableW = window.innerWidth - xPadding;
  const availableH = window.innerHeight - yPadding;

  if (availableW <= 0 || availableH <= 0) return;

  const { cols, rows } = config.value;
  const gap = 8; // 0.5rem in pixels

  // Calculate max cell width based on width constraint
  // availableW = cols * w + (cols - 1) * gap
  const w_by_width = (availableW - (cols - 1) * gap) / cols;

  // Calculate max cell width based on height constraint
  // availableH = rows * h + (rows - 1) * gap
  // h = w * 9 / 16
  // availableH - (rows - 1) * gap = rows * w * (9/16)
  const w_by_height = ((availableH - (rows - 1) * gap) / rows) * (16 / 9);

  // Choose the smaller width to satisfy both constraints
  const cellWidth = Math.min(w_by_width, w_by_height);

  // Calculate final container dimensions
  contentWidth.value = cols * cellWidth + (cols - 1) * gap;
  contentHeight.value = rows * ((cellWidth * 9) / 16) + (rows - 1) * gap;
};

onMounted(() => {
  updateSize();
  window.addEventListener('resize', updateSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateSize);
});

watch([config, () => store.isLoading], async () => {
  await nextTick();
  updateSize();
});

const isCellActive = (cell: any) => {
  return props.activeCell && props.activeCell.row === cell.row && props.activeCell.col === cell.col;
};

const gridStyle = computed(() => {
  if (!config.value) return {};
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${config.value.cols}, minmax(0, 1fr))`,
    gap: '0.5rem',
    width: `${contentWidth.value}px`,
    height: `${contentHeight.value}px`,
  };
});
</script>

<template>
  <div v-if="isLoading && cells.length === 0" class="flex h-96 items-center justify-center">
    <Loader2 class="text-muted-foreground h-8 w-8 animate-spin" />
  </div>

  <div v-else-if="config" ref="containerRef" class="flex h-full w-full items-center justify-center p-2">
    <div class="rounded-xl border bg-stone-50 p-2 shadow-sm transition-all duration-300" :style="gridStyle">
      <div
        v-for="cell in cells"
        :key="cell.id"
        :class="
          cn(
            'group relative flex aspect-[16/9] items-end border-2 border-stone-200 bg-stone-200/50 px-2 py-1 transition-all duration-300 hover:border-stone-400 hover:shadow-md',
            isCellActive(cell)
              ? 'z-20 scale-105 border-yellow-400 bg-yellow-50/80 shadow-[0_0_40px_rgba(250,204,21,0.6)] ring-4 ring-yellow-400/80'
              : '',
          )
        "
      >
        <!-- Shelf shadow inner -->
        <div class="pointer-events-none absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.05)]" />

        <!-- Books -->
        <div class="relative z-10 flex h-full w-full items-end space-x-[1px]">
          <BookSpine
            v-for="book in cell.books"
            :key="book._id"
            :book="book"
            :highlighted="props.highlightedBookIds?.includes(book._id) || false"
            @click.stop="$emit('select-book', book)"
          />
        </div>

        <!-- Hover Actions (Floating Top Right) -->
        <div
          class="absolute top-1 right-1 z-40 flex translate-y-[-6px] gap-1 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100"
        >
          <Button
            size="icon"
            variant="secondary"
            class="hover:text-primary h-6 w-6 rounded-full border border-stone-200 bg-white/90 shadow-md hover:bg-white"
            title="录入书籍"
            @click.stop="$emit('entry', cell)"
          >
            <ScanBarcode class="h-3 w-3" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            class="h-6 w-6 rounded-full border border-stone-200 bg-white/90 shadow-md hover:bg-white hover:text-yellow-600"
            title="灯光定位"
            @click.stop="$emit('locate', cell)"
          >
            <Lightbulb class="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
