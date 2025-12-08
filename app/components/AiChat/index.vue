<script setup lang="ts">
import ChatMessage from './ChatMessage.vue';
import type { ChatMessage as ChatMessageType, ToolCallInfo, SSEEvent, BookInfo, Position } from './types';
import { quickQuestions } from './types';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { Send, Sparkles, Loader2, ChevronDown, X } from 'lucide-vue-next';
import { ref, nextTick, watch } from 'vue';
import { Button } from '~/components/ui/button';
import { ScrollArea } from '~/components/ui/scroll-area';

const emit = defineEmits<{
  highlight: [pos: Position | null];
  selectBook: [book: BookInfo];
}>();

// 状态
const isExpanded = ref(false);
const inputMessage = ref('');
const isLoading = ref(false);
const scrollAreaRef = ref<any>(null);
const inputRef = ref<HTMLTextAreaElement | null>(null);

// 消息列表
const messages = ref<ChatMessageType[]>([
  {
    id: 'welcome',
    role: 'assistant',
    content: '你好！我是你的智能书墙助手 ✨\n\n我可以帮你查询书籍、统计分类、查找位置，还能进行语义搜索哦！',
    status: 'done',
    createdAt: Date.now(),
  },
]);

// 生成唯一ID
const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// 滚动到底部
const scrollToBottom = (smooth = true) => {
  nextTick(() => {
    if (!scrollAreaRef.value) return;

    // 尝试多种选择器找到 viewport
    const el = scrollAreaRef.value.$el || scrollAreaRef.value;
    const viewport =
      el.querySelector('[data-radix-scroll-area-viewport]') ||
      el.querySelector('[data-reka-scroll-area-viewport]') ||
      el.querySelector('[style*="overflow"]') ||
      el.firstElementChild;

    if (viewport) {
      console.log('[Scroll] viewport found:', viewport.tagName, 'scrollHeight:', viewport.scrollHeight);
      if (smooth) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth',
        });
      } else {
        viewport.scrollTop = viewport.scrollHeight;
      }
    } else {
      console.warn('[Scroll] viewport not found');
    }
  });
};

// 监听消息变化，自动滚动到底部
watch(
  () => messages.value.length,
  () => {
    scrollToBottom();
  },
);

// 监听最后一条消息内容变化（流式输出时）
watch(
  () => messages.value[messages.value.length - 1]?.content,
  () => {
    scrollToBottom(false);
  },
  { deep: true },
);

// 发送消息
const sendMessage = async (content?: string) => {
  const userMessage = (content || inputMessage.value).trim();
  if (!userMessage || isLoading.value) return;

  // 展开对话区域
  isExpanded.value = true;

  // 添加用户消息
  const userMsg: ChatMessageType = {
    id: generateId(),
    role: 'user',
    content: userMessage,
    status: 'done',
    createdAt: Date.now(),
  };
  messages.value.push(userMsg);

  // 清空输入框
  inputMessage.value = '';
  isLoading.value = true;
  scrollToBottom();

  // 创建 AI 消息占位
  const assistantMsgId = generateId();
  messages.value.push({
    id: assistantMsgId,
    role: 'assistant',
    content: '',
    toolCalls: [],
    status: 'streaming',
    createdAt: Date.now(),
  });
  scrollToBottom();

  // 获取 assistant 消息的索引（用于响应式更新）
  const getAssistantMsg = () => messages.value.find((m) => m.id === assistantMsgId)!;

  // 构建消息历史（排除 welcome 消息和当前空的 assistant 消息）
  const apiMessages = messages.value
    .filter((m) => m.id !== 'welcome' && m.id !== assistantMsgId && m.status === 'done')
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  try {
    await fetchEventSource('/api/ai/chat-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: apiMessages }),

      onmessage(ev) {
        if (!ev.data) return;

        try {
          const data = JSON.parse(ev.data);
          const eventType = ev.event as SSEEvent['event'];
          const msg = getAssistantMsg();

          console.log('[SSE]', eventType, data); // 调试日志

          switch (eventType) {
            case 'delta':
              // 追加文本内容 - 使用响应式更新
              msg.content = (msg.content || '') + (data.content || '');
              scrollToBottom();
              break;

            case 'tool_call': {
              // 添加工具调用
              const toolCall: ToolCallInfo = {
                id: data.id,
                name: data.name,
                args: data.args,
                status: 'running',
              };
              if (!msg.toolCalls) msg.toolCalls = [];
              msg.toolCalls = [...msg.toolCalls, toolCall];
              scrollToBottom();
              break;
            }

            case 'tool_result': {
              // 更新工具结果
              if (msg.toolCalls) {
                msg.toolCalls = msg.toolCalls.map((tc) =>
                  tc.id === data.id
                    ? {
                        ...tc,
                        result: data.result,
                        error: data.error,
                        status: data.error ? 'error' : 'done',
                      }
                    : tc,
                ) as ToolCallInfo[];
              }
              scrollToBottom();
              break;
            }

            case 'done':
              msg.status = 'done';
              break;

            case 'error':
              msg.status = 'error';
              if (!msg.content) {
                msg.content = `抱歉，发生了错误：${data.message}`;
              }
              break;
          }
        } catch (e) {
          console.error('[SSE] Parse error:', e);
        }
      },

      onerror(err) {
        console.error('SSE Error:', err);
        const msg = getAssistantMsg();
        msg.status = 'error';
        if (!msg.content) {
          msg.content = '抱歉，连接出现问题，请稍后重试。';
        }
        throw err; // 停止重试
      },

      onclose() {
        const msg = getAssistantMsg();
        if (msg.status === 'streaming') {
          msg.status = 'done';
        }
      },
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    const msg = getAssistantMsg();
    if (msg.status === 'streaming') {
      msg.status = 'error';
      if (!msg.content) {
        msg.content = '抱歉，AI 服务暂时不可用，请稍后重试。';
      }
    }
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

// 快捷问题
const askQuickQuestion = (question: string) => {
  sendMessage(question);
};

// 回车发送
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

// 切换展开状态
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
  if (isExpanded.value) {
    nextTick(() => inputRef.value?.focus());
  }
};

// 关闭对话
const closeChat = () => {
  isExpanded.value = false;
};

// 点击输入框时展开
const handleInputFocus = () => {
  if (!isExpanded.value) {
    isExpanded.value = true;
  }
};

// 监听展开状态，自动聚焦
watch(isExpanded, (expanded) => {
  if (expanded) {
    nextTick(() => {
      inputRef.value?.focus();
      scrollToBottom();
    });
  }
});

// 处理书籍定位
const handleLocate = (pos: Position) => {
  emit('highlight', pos);
};

// 处理书籍选择
const handleSelectBook = (book: BookInfo) => {
  emit('selectBook', book);
};
</script>

<template>
  <div class="fixed inset-x-0 bottom-6 z-50 mx-auto w-full max-w-2xl px-4">
    <!-- 展开的对话区域 -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4 scale-95"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-95"
    >
      <div v-if="isExpanded" class="mb-3 overflow-hidden rounded-2xl border border-white/20 bg-white/80 shadow-2xl backdrop-blur-xl">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-stone-200/50 px-4 py-3">
          <div class="flex items-center gap-2">
            <div class="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-1.5">
              <Sparkles class="h-4 w-4 text-white" />
            </div>
            <span class="font-medium text-stone-700">AI 智能助手</span>
          </div>
          <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full text-stone-400 hover:text-stone-600" @click="closeChat">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <!-- Messages Area - 固定高度 -->
        <ScrollArea ref="scrollAreaRef" class="h-[70vh] max-h-[600px]">
          <div class="space-y-4 p-4">
            <ChatMessage
              v-for="message in messages"
              :key="message.id"
              :message="message"
              @locate="handleLocate"
              @select-book="handleSelectBook"
            />

            <!-- Loading indicator -->
            <div v-if="isLoading && messages[messages.length - 1]?.status !== 'streaming'" class="flex justify-start">
              <div class="rounded-2xl bg-stone-100/80 px-4 py-3">
                <Loader2 class="h-5 w-5 animate-spin text-stone-500" />
              </div>
            </div>

            <!-- Quick questions (only show initially) -->
            <div v-if="messages.length === 1" class="space-y-2 pt-2">
              <p class="text-xs text-stone-400">快速开始：</p>
              <div class="flex flex-wrap gap-2">
                <Button
                  v-for="question in quickQuestions"
                  :key="question"
                  variant="outline"
                  size="sm"
                  class="h-auto bg-white/50 px-3 py-1.5 text-xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                  @click="askQuickQuestion(question)"
                >
                  {{ question }}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </Transition>

    <!-- 底部输入栏 -->
    <div
      class="relative rounded-2xl border border-white/30 bg-white/70 shadow-lg backdrop-blur-xl transition-all"
      :class="isExpanded ? 'border-stone-200/50' : 'hover:shadow-xl'"
    >
      <!-- Glow effect -->
      <div
        class="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 blur-xl transition-opacity duration-500"
        :class="{ 'opacity-100': isExpanded }"
      />

      <div class="relative flex items-center gap-3 px-4 py-3">
        <!-- Sparkles icon / Expand button -->
        <Button
          v-if="!isExpanded"
          size="icon"
          class="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md transition-transform hover:scale-105"
          @click="toggleExpand"
        >
          <Sparkles class="h-5 w-5" />
        </Button>

        <!-- Input -->
        <textarea
          ref="inputRef"
          v-model="inputMessage"
          placeholder="问我任何关于书籍的问题..."
          class="max-h-24 min-h-[40px] flex-1 resize-none bg-transparent text-sm text-stone-700 outline-none placeholder:text-stone-400"
          rows="1"
          @focus="handleInputFocus"
          @keydown="handleKeydown"
        />

        <!-- Send button -->
        <Button
          :disabled="!inputMessage.trim() || isLoading"
          size="icon"
          class="h-9 w-9 shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50"
          @click="() => sendMessage()"
        >
          <Send v-if="!isLoading" class="h-4 w-4" />
          <Loader2 v-else class="h-4 w-4 animate-spin" />
        </Button>

        <!-- Collapse button (when expanded) -->
        <Button
          v-if="isExpanded"
          variant="ghost"
          size="icon"
          class="h-8 w-8 rounded-full text-stone-400 hover:text-stone-600"
          @click="toggleExpand"
        >
          <ChevronDown class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
