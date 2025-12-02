<script setup lang="ts">
import { cn } from '@/lib/utils';
import { Library } from 'lucide-vue-next';
import { computed } from 'vue';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '~/components/ui/hover-card';

interface Props {
  book: {
    title?: string;
    isbn?: string;
    _id?: string;
    img?: string;
    [key: string]: any;
  };
  class?: string;
  highlighted?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  click: [];
}>();

// Generate a consistent color based on title
const spineColor = computed(() => {
  const colors = [
    'bg-red-900',
    'bg-red-800',
    'bg-blue-900',
    'bg-blue-800',
    'bg-green-900',
    'bg-green-800',
    'bg-amber-900',
    'bg-amber-800',
    'bg-slate-800',
    'bg-slate-700',
    'bg-stone-800',
    'bg-stone-700',
    'bg-indigo-900',
    'bg-purple-900',
  ];
  // Simple hash
  let hash = 0;
  const str = props.book.title || 'Unknown';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
});

// Random height for realistic spine look (between 85% and 100%)
const heightStyle = computed(() => {
  let hash = 0;
  const str = props.book.title || 'Unknown';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = 85 + (Math.abs(hash) % 16);
  return { height: `${h}%` };
});

// Width based on pages or random
const computedWidth = computed(() => {
  const pages = parseInt(String(props.book.pages || '').replace(/[^\d]/g, ''), 10);
  if (!isNaN(pages) && pages > 0) {
    // Map pages to pixels: min 16px, max 50px
    const w = Math.min(Math.max(Math.floor(pages / 15), 16), 50);
    return { width: `${w}px` };
  }
  return null;
});

const widthClass = computed(() => {
  if (computedWidth.value) return '';
  const widths = ['w-6', 'w-7', 'w-8', 'w-9'];
  let hash = 0;
  const str = props.book.title || 'Unknown';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return widths[Math.abs(hash) % widths.length];
});
</script>

<template>
  <HoverCard :open-delay="200" :close-delay="100">
    <HoverCardTrigger as-child>
      <div
        :style="{ ...heightStyle, ...computedWidth }"
        :class="
          cn(
            'relative flex cursor-pointer items-center justify-center overflow-hidden rounded-sm border-r border-white/10 shadow-md transition-all duration-200 hover:z-20 hover:-translate-y-2 hover:scale-110',
            spineColor,
            widthClass,
            props.highlighted
              ? 'z-30 scale-110 animate-pulse shadow-[0_0_30px_rgba(34,211,238,0.8),0_0_60px_rgba(34,211,238,0.4)] ring-2 ring-cyan-400 ring-offset-2'
              : '',
            props.class,
          )
        "
        @click="emit('click')"
      >
        <span
          class="truncate py-2 font-serif text-[10px] leading-tight font-medium tracking-wider text-white/90 opacity-90 select-none"
          style="writing-mode: vertical-rl; text-orientation: mixed"
        >
          {{ book.title }}
        </span>

        <!-- Decorative spine details -->
        <div class="absolute right-0 bottom-4 left-0 h-[1px] bg-white/20" />
        <div class="absolute top-4 right-0 left-0 h-[1px] bg-white/20" />
      </div>
    </HoverCardTrigger>

    <HoverCardContent side="top" :side-offset="8" class="w-auto p-2">
      <div class="w-32">
        <div class="relative mb-2 aspect-[2/3] overflow-hidden rounded-md bg-stone-100 shadow-inner">
          <img v-if="book.img" :src="book.img" class="h-full w-full object-cover" />
          <div v-else class="flex h-full w-full items-center justify-center text-stone-300">
            <Library class="h-8 w-8" />
          </div>
        </div>
        <div class="truncate text-center text-[10px] font-medium text-stone-600">
          {{ book.title }}
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
</template>
