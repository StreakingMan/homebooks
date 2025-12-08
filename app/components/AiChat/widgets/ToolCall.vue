<script setup lang="ts">
import type { ToolCallInfo, BookInfo, Position } from '../types';
import BookCard from './BookCard.vue';
import { Loader2, CheckCircle2, XCircle, Search, BarChart3, MapPin, Sparkles, BookOpen } from 'lucide-vue-next';
import { computed, type Component } from 'vue';
import { Card } from '~/components/ui/card';

const props = defineProps<{
  toolCall: ToolCallInfo;
}>();

const emit = defineEmits<{
  locate: [pos: Position];
  selectBook: [book: BookInfo];
}>();

// 工具名称映射
const toolLabels: Record<string, { label: string; icon: Component }> = {
  query_books: { label: '搜索书籍', icon: Search },
  get_book_statistics: { label: '获取统计', icon: BarChart3 },
  find_book_location: { label: '查找位置', icon: MapPin },
  semantic_search_books: { label: '语义搜索', icon: Sparkles },
  find_similar_books: { label: '相似推荐', icon: BookOpen },
};

const toolInfo = computed(() => toolLabels[props.toolCall.name] || { label: props.toolCall.name, icon: Search });
const isLoading = computed(() => props.toolCall.status === 'running' || props.toolCall.status === 'pending');
const isError = computed(() => props.toolCall.status === 'error' || props.toolCall.error);
const isDone = computed(() => props.toolCall.status === 'done' && !props.toolCall.error);

// 解析结果中的书籍列表
const books = computed<BookInfo[]>(() => {
  const result = props.toolCall.result;
  if (!result) return [];

  // query_books, semantic_search_books
  if (result.books) return result.books;
  if (result.results) return result.results;
  if (result.similar_books) return result.similar_books;

  // find_book_location 返回单本或多本
  if (result.found && result.books) return result.books;

  return [];
});

// 是否显示书籍卡片
const showBookCards = computed(() => books.value.length > 0);

// 统计信息
const statistics = computed(() => {
  const result = props.toolCall.result;
  if (!result || props.toolCall.name !== 'get_book_statistics') return null;
  return result;
});

// 处理书籍点击
const handleBookClick = (book: BookInfo) => {
  emit('selectBook', book);
};

// 处理定位点击
const handleLocate = (pos: Position) => {
  emit('locate', pos);
};
</script>

<template>
  <Card class="border-stone-200/50 bg-white/50 p-3">
    <!-- Header -->
    <div class="flex items-center gap-2 text-xs">
      <component :is="toolInfo.icon" class="h-3.5 w-3.5 text-stone-500" />
      <span class="font-medium text-stone-600">{{ toolInfo.label }}</span>

      <!-- Status -->
      <div class="ml-auto flex items-center gap-1">
        <Loader2 v-if="isLoading" class="h-3.5 w-3.5 animate-spin text-blue-500" />
        <CheckCircle2 v-else-if="isDone" class="h-3.5 w-3.5 text-green-500" />
        <XCircle v-else-if="isError" class="h-3.5 w-3.5 text-red-500" />
      </div>
    </div>

    <!-- Arguments (简化显示) -->
    <div v-if="toolCall.args && Object.keys(toolCall.args).length > 0" class="mt-2 text-xs text-stone-400">
      <span v-for="(value, key) in toolCall.args" :key="key" class="mr-2">
        {{ key }}: <span class="text-stone-500">{{ value }}</span>
      </span>
    </div>

    <!-- Results -->
    <div v-if="isDone && toolCall.result" class="mt-3">
      <!-- 书籍卡片列表 -->
      <div v-if="showBookCards" class="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <BookCard
          v-for="(book, index) in books.slice(0, 6)"
          :key="book.isbn || index"
          :book="book"
          :show-similarity="toolCall.name === 'semantic_search_books' || toolCall.name === 'find_similar_books'"
          @click="handleBookClick(book)"
          @locate="handleLocate"
        />
      </div>

      <!-- 统计信息 -->
      <div v-else-if="statistics" class="space-y-2 text-xs">
        <div v-if="statistics.total !== undefined" class="flex items-center justify-between rounded-lg bg-stone-100/50 px-3 py-2">
          <span class="text-stone-500">总数</span>
          <span class="font-semibold text-stone-700">{{ statistics.total }} 本</span>
        </div>
        <div v-if="statistics.on_wall !== undefined" class="flex items-center justify-between rounded-lg bg-stone-100/50 px-3 py-2">
          <span class="text-stone-500">已上墙</span>
          <span class="font-semibold text-green-600">{{ statistics.on_wall }} 本</span>
        </div>
        <div v-if="statistics.unplaced !== undefined" class="flex items-center justify-between rounded-lg bg-stone-100/50 px-3 py-2">
          <span class="text-stone-500">未上墙</span>
          <span class="font-semibold text-orange-500">{{ statistics.unplaced }} 本</span>
        </div>
        <!-- Top 列表 -->
        <div v-if="statistics.top_authors" class="mt-2">
          <div class="mb-1 text-stone-500">作者排行</div>
          <div v-for="item in statistics.top_authors.slice(0, 5)" :key="item.author" class="flex justify-between py-0.5">
            <span class="truncate text-stone-600">{{ item.author }}</span>
            <span class="text-stone-400">{{ item.count }}</span>
          </div>
        </div>
        <div v-if="statistics.top_categories" class="mt-2">
          <div class="mb-1 text-stone-500">分类排行</div>
          <div v-for="item in statistics.top_categories.slice(0, 5)" :key="item.category" class="flex justify-between py-0.5">
            <span class="truncate text-stone-600">{{ item.category }}</span>
            <span class="text-stone-400">{{ item.count }}</span>
          </div>
        </div>
      </div>

      <!-- 通用结果 (fallback) -->
      <div v-else-if="!showBookCards" class="text-xs text-stone-500">
        <template v-if="toolCall.result.message">
          {{ toolCall.result.message }}
        </template>
        <template v-else-if="toolCall.result.total !== undefined"> 共找到 {{ toolCall.result.total }} 条结果 </template>
      </div>
    </div>

    <!-- Error -->
    <div v-if="isError" class="mt-2 text-xs text-red-500">
      {{ toolCall.result?.message || '执行失败' }}
    </div>
  </Card>
</template>
