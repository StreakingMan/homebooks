<script setup lang="ts">
import type { BookInfo, Position } from '../types';
import { MapPin } from 'lucide-vue-next';
import { computed } from 'vue';
import { Badge } from '~/components/ui/badge';
import { Card } from '~/components/ui/card';

const props = defineProps<{
  book: BookInfo;
  showSimilarity?: boolean;
}>();

const emit = defineEmits<{
  click: [];
  locate: [pos: Position];
}>();

const hasPosition = computed(() => props.book.position != null);

const handleClick = () => {
  emit('click');
};

const handleLocate = (e: Event) => {
  e.stopPropagation();
  if (props.book.position) {
    emit('locate', { row: props.book.position.row, col: props.book.position.col });
  }
};
</script>

<template>
  <Card
    class="group cursor-pointer overflow-hidden border-stone-200/50 bg-white/80 transition-all hover:border-blue-300 hover:shadow-md"
    @click="handleClick"
  >
    <!-- Book Cover -->
    <div class="relative aspect-[3/4] w-full overflow-hidden bg-stone-100">
      <img
        v-if="book.img"
        :src="book.img"
        :alt="book.title"
        class="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
      <div v-else class="flex h-full w-full items-center justify-center p-2 text-center">
        <span class="text-[10px] leading-tight text-stone-400">{{ book.title }}</span>
      </div>

      <!-- Position badge -->
      <Badge
        v-if="hasPosition"
        class="absolute top-1 right-1 cursor-pointer gap-0.5 bg-green-500 px-1.5 py-0.5 text-[10px] hover:bg-green-600"
        @click="handleLocate"
      >
        <MapPin class="h-2.5 w-2.5" />
        {{ book.position!.row + 1 }}-{{ book.position!.col + 1 }}
      </Badge>

      <!-- Similarity badge -->
      <Badge v-if="showSimilarity && book.similarity" class="absolute bottom-1 left-1 bg-purple-500/90 px-1.5 py-0.5 text-[10px]">
        {{ book.similarity }}%
      </Badge>
    </div>

    <!-- Info -->
    <div class="p-2">
      <h4 class="truncate text-xs font-medium text-stone-700">{{ book.title }}</h4>
      <p v-if="book.author" class="truncate text-[10px] text-stone-400">{{ book.author }}</p>
    </div>
  </Card>
</template>
