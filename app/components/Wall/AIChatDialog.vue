<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Sparkles, Loader2 } from 'lucide-vue-next';
import { ref, nextTick } from 'vue';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const messages = ref<Message[]>([
  {
    role: 'assistant',
    content: '你好！我是你的智能书墙助手。我可以帮你查询书籍、统计分类、查找位置等。有什么可以帮你的吗？',
  },
]);

const inputMessage = ref('');
const isLoading = ref(false);
const scrollAreaRef = ref<any>(null);

// 发送消息
async function sendMessage() {
  const userMessage = inputMessage.value.trim();
  if (!userMessage || isLoading.value) return;

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: userMessage,
  });

  inputMessage.value = '';
  isLoading.value = true;

  // 滚动到底部
  await nextTick();
  scrollToBottom();

  try {
    // 调用AI接口
    const response = await $fetch('/api/ai/chat', {
      method: 'POST',
      body: {
        messages: messages.value,
      },
    });

    // 添加AI回复
    if (response.success && response.message) {
      messages.value.push({
        role: 'assistant',
        content: response.message.content,
      });
    } else {
      throw new Error('AI回复格式错误');
    }
  } catch (error: any) {
    console.error('AI请求失败:', error);
    messages.value.push({
      role: 'assistant',
      content: '抱歉，AI服务暂时不可用，请稍后再试。',
    });
  } finally {
    isLoading.value = false;
    await nextTick();
    scrollToBottom();
  }
}

// 滚动到底部
function scrollToBottom() {
  if (scrollAreaRef.value) {
    const viewport = scrollAreaRef.value.$el.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }
}

// 快捷问题
const quickQuestions = ['我有多少本书？', '有哪些前端开发的书？', '国外作者的书有哪些？', '《React设计原理》在哪个位置？'];

function askQuickQuestion(question: string) {
  inputMessage.value = question;
  sendMessage();
}

// 回车发送
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(val) => emit('update:open', val)">
    <DialogContent class="flex h-[85vh] max-w-3xl flex-col p-0">
      <!-- Header -->
      <DialogHeader class="border-b px-6 py-4">
        <div class="flex items-center gap-2">
          <div class="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-2">
            <Sparkles class="h-5 w-5 text-white" />
          </div>
          <div>
            <DialogTitle class="text-lg">AI 智能助手</DialogTitle>
            <DialogDescription class="text-sm"> 询问关于您书籍的任何问题 </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <!-- Messages Area -->
      <ScrollArea ref="scrollAreaRef" class="flex-1 px-6 py-4">
        <div class="space-y-4">
          <div
            v-for="(message, index) in messages"
            :key="index"
            class="flex"
            :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[80%] rounded-2xl px-4 py-3"
              :class="message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-stone-100 text-stone-900'"
            >
              <p class="text-sm whitespace-pre-wrap">{{ message.content }}</p>
            </div>
          </div>

          <!-- Loading indicator -->
          <div v-if="isLoading" class="flex justify-start">
            <div class="rounded-2xl bg-stone-100 px-4 py-3">
              <Loader2 class="h-5 w-5 animate-spin text-stone-600" />
            </div>
          </div>

          <!-- Quick questions (only show when no messages yet) -->
          <div v-if="messages.length === 1" class="space-y-2 pt-4">
            <p class="mb-2 text-sm text-stone-500">快速开始：</p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="question in quickQuestions"
                :key="question"
                class="rounded-lg border border-stone-200 px-3 py-2 text-sm transition-colors hover:border-blue-400 hover:bg-blue-50"
                @click="askQuickQuestion(question)"
              >
                {{ question }}
              </button>
            </div>
          </div>
        </div>
      </ScrollArea>

      <!-- Input Area -->
      <div class="border-t px-6 py-4">
        <div class="flex gap-2">
          <textarea
            v-model="inputMessage"
            placeholder="输入你的问题..."
            class="max-h-32 min-h-[44px] flex-1 resize-none rounded-lg border border-stone-200 px-4 py-3 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            rows="1"
            @keydown="handleKeydown"
          />
          <Button :disabled="!inputMessage.trim() || isLoading" class="h-11 w-11 rounded-lg" @click="sendMessage">
            <Send v-if="!isLoading" class="h-5 w-5" />
            <Loader2 v-else class="h-5 w-5 animate-spin" />
          </Button>
        </div>
        <p class="mt-2 text-xs text-stone-400">按 Enter 发送，Shift + Enter 换行</p>
      </div>
    </DialogContent>
  </Dialog>
</template>
