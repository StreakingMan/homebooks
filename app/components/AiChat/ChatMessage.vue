<script setup lang="ts">
import MessageContent from './MessageContent.vue';
import type { ChatMessage, BookInfo, Position } from './types';
import ToolCallWidget from './widgets/ToolCall.vue';
import { User, Bot } from 'lucide-vue-next';
import { computed } from 'vue';

const props = defineProps<{
  message: ChatMessage;
}>();

const emit = defineEmits<{
  locate: [pos: Position];
  selectBook: [book: BookInfo];
}>();

const isUser = computed(() => props.message.role === 'user');
const isStreaming = computed(() => props.message.status === 'streaming');

// 转发事件
const handleLocate = (pos: Position) => {
  emit('locate', pos);
};

const handleSelectBook = (book: BookInfo) => {
  emit('selectBook', book);
};
</script>

<template>
  <div class="flex gap-3" :class="isUser ? 'flex-row-reverse' : 'flex-row'">
    <!-- Avatar -->
    <div
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      :class="isUser ? 'bg-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'"
    >
      <User v-if="isUser" class="h-4 w-4 text-white" />
      <Bot v-else class="h-4 w-4 text-white" />
    </div>

    <!-- Content -->
    <div class="flex max-w-[85%] flex-col gap-2" :class="isUser ? 'items-end' : 'items-start'">
      <!-- Tool Calls (显示在文本上方) -->
      <div v-if="!isUser && message.toolCalls && message.toolCalls.length > 0" class="w-full space-y-2">
        <ToolCallWidget
          v-for="toolCall in message.toolCalls"
          :key="toolCall.id"
          :tool-call="toolCall"
          @locate="handleLocate"
          @select-book="handleSelectBook"
        />
      </div>

      <!-- Message Bubble -->
      <div
        class="rounded-2xl px-4 py-2.5"
        :class="isUser ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : 'bg-stone-100/80 text-stone-800'"
      >
        <!-- User message: plain text -->
        <p v-if="isUser" class="text-sm whitespace-pre-wrap">{{ message.content }}</p>

        <!-- Assistant message: markdown -->
        <template v-else>
          <MessageContent
            v-if="message.content"
            :content="message.content"
            :streaming="isStreaming"
            @locate="handleLocate"
            @select-book="handleSelectBook"
          />

          <!-- Streaming cursor -->
          <span v-if="isStreaming && !message.content" class="inline-block h-4 w-1 animate-pulse bg-stone-400" />
        </template>
      </div>

      <!-- Status indicators -->
      <div v-if="message.status === 'error'" class="text-xs text-red-500">发送失败</div>
    </div>
  </div>
</template>
