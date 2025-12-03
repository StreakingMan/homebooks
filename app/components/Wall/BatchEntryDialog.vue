<script setup lang="ts">
import { Loader2, Check, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ScanBarcode, Keyboard } from 'lucide-vue-next';
import { ref, watch, computed, onUnmounted, nextTick } from 'vue';
import { toast } from 'vue-sonner';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useBookStore } from '~/stores/book';

const props = defineProps<{
  open: boolean;
  cell: { row: number; col: number; books: any[] } | null;
}>();

const emit = defineEmits(['update:open', 'book-added', 'highlight-cell']);

const store = useBookStore();
const isProcessing = ref(false);
const recentBooks = ref<any[]>([]);

// 录入模式：'scanner' 扫码枪 | 'manual' 手动输入
const inputMode = ref<'scanner' | 'manual'>('scanner');

// 手动输入模式
const manualInput = ref('');
const manualInputRef = ref<InstanceType<typeof Input> | null>(null);

const focusManualInput = () => {
  nextTick(() => {
    const inputEl = manualInputRef.value?.$el?.querySelector('input') || manualInputRef.value?.$el;
    inputEl?.focus();
  });
};

const handleManualScan = () => {
  const isbn = manualInput.value.trim();
  if (isbn) {
    handleScan(isbn);
    manualInput.value = '';
    focusManualInput();
  }
};

// 切换模式
const toggleMode = () => {
  if (inputMode.value === 'scanner') {
    inputMode.value = 'manual';
    stopListening();
    setTimeout(focusManualInput, 100);
  } else {
    inputMode.value = 'scanner';
    manualInput.value = '';
    startListening();
  }
};

// 扫码缓冲区
const scanBuffer = ref('');
const scanTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const SCAN_TIMEOUT_MS = 100; // 扫码枪输入间隔通常很短，100ms 内无输入则清空

// 清空扫码缓冲区
const clearScanBuffer = () => {
  scanBuffer.value = '';
  if (scanTimeout.value) {
    clearTimeout(scanTimeout.value);
    scanTimeout.value = null;
  }
};

// 重置超时
const resetScanTimeout = () => {
  if (scanTimeout.value) {
    clearTimeout(scanTimeout.value);
  }
  scanTimeout.value = setTimeout(clearScanBuffer, SCAN_TIMEOUT_MS);
};

// 全局键盘事件处理
const handleKeyDown = (e: KeyboardEvent) => {
  // 安全检查：确保对话框是打开状态（防止监听器未正确移除时继续捕获输入）
  if (!props.open) return;

  // 如果正在处理中，忽略输入
  if (isProcessing.value) return;

  // 忽略组合键
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  // 如果焦点在输入框或下拉框中，不处理（让原生行为生效）
  const activeEl = document.activeElement;
  const tagName = activeEl?.tagName?.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return;
  }

  // Enter 键 - 触发扫描
  if (e.key === 'Enter') {
    e.preventDefault();
    if (scanBuffer.value.trim()) {
      handleScan(scanBuffer.value.trim());
      clearScanBuffer();
    }
    return;
  }

  // 可打印字符 - 添加到缓冲区
  if (e.key.length === 1) {
    e.preventDefault();
    scanBuffer.value += e.key;
    resetScanTimeout();
  }
};

// 添加/移除键盘监听
const startListening = () => {
  document.addEventListener('keydown', handleKeyDown);
};

const stopListening = () => {
  document.removeEventListener('keydown', handleKeyDown);
  clearScanBuffer();
};

// 组件卸载时清理
onUnmounted(() => {
  stopListening();
});

// Target Cell State
const selectedRow = ref<string>('');
const selectedCol = ref<string>('');

const targetCell = computed(() => {
  if (selectedRow.value === '' || selectedCol.value === '') return null;
  return { row: parseInt(selectedRow.value), col: parseInt(selectedCol.value) };
});

// Unplaced Books Selection
const selectedUnplacedIds = ref<string[]>([]);
const isMoving = ref(false);

// Options
const rowOptions = computed(() => {
  if (!store.config) return [];
  return Array.from({ length: store.config.rows }, (_, i) => ({ value: String(i), label: `第 ${i + 1} 行` }));
});

const colOptions = computed(() => {
  if (!store.config) return [];
  return Array.from({ length: store.config.cols }, (_, i) => ({ value: String(i), label: `第 ${i + 1} 列` }));
});

// Watchers
watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      recentBooks.value = [];
      clearScanBuffer();
      manualInput.value = '';
      selectedUnplacedIds.value = [];
      if (props.cell) {
        selectedRow.value = String(props.cell.row);
        selectedCol.value = String(props.cell.col);
      } else {
        selectedRow.value = '';
        selectedCol.value = '';
      }
      // 根据模式启动
      if (inputMode.value === 'scanner') {
        startListening();
      } else {
        setTimeout(focusManualInput, 100);
      }
    } else {
      // 停止监听
      stopListening();
      emit('highlight-cell', null);
    }
  },
);

watch(targetCell, (newCell) => {
  if (newCell && props.open) {
    emit('highlight-cell', newCell);
  } else {
    emit('highlight-cell', null);
  }
});

// Navigation
const move = (dRow: number, dCol: number) => {
  if (!store.config || !targetCell.value) return;

  // Consume (clear list)
  recentBooks.value = [];
  selectedUnplacedIds.value = [];

  let newRow = targetCell.value.row + dRow;
  let newCol = targetCell.value.col + dCol;

  // Clamp
  newRow = Math.max(0, Math.min(newRow, store.config.rows - 1));
  newCol = Math.max(0, Math.min(newCol, store.config.cols - 1));

  selectedRow.value = String(newRow);
  selectedCol.value = String(newCol);
};

const handleScan = async (isbn: string) => {
  if (!isbn) return;

  isProcessing.value = true;
  try {
    const bookData: any = await $fetch(`/api/books/${isbn}`);
    if (!bookData) throw new Error('Lookup failed');

    const createRes: any = await $fetch('/api/books/create', {
      method: 'POST',
      body: {
        book: {
          title: bookData.title,
          isbn: bookData.isbn,
          author: bookData.author,
          publisher: bookData.publisher,
          pubdate: bookData.pubdate,
          img: bookData.img,
          summary: bookData.summary,
          price: bookData.price,
        },
        // 有格口则放入格口，否则放入待整理区
        position: targetCell.value ? { row: targetCell.value.row, col: targetCell.value.col } : null,
      },
    });

    if (createRes.success) {
      const location = targetCell.value ? `${targetCell.value.row + 1}-${targetCell.value.col + 1}` : '待整理区';
      toast.success(`已录入: ${createRes.book.title} → ${location}`);
      recentBooks.value.unshift(createRes.book);
      store.addBook(createRes.book);
    }
  } catch (e) {
    toast.error(`录入失败: ${isbn}`);
    console.error(e);
  } finally {
    isProcessing.value = false;
  }
};

const moveUnplaced = async () => {
  if (selectedUnplacedIds.value.length === 0 || !targetCell.value) return;

  isMoving.value = true;
  try {
    const tasks = selectedUnplacedIds.value.map((id) => {
      const book = store.books.find((b) => b._id === id);
      if (!book) return Promise.resolve();

      return $fetch('/api/books/update', {
        method: 'POST',
        body: {
          id: book._id,
          position: { row: targetCell.value?.row, col: targetCell.value?.col, order: 0 },
        },
      }).then((res: any) => {
        if (res.success) {
          store.updateBook(res.book);
          recentBooks.value.unshift(res.book);
        }
      });
    });

    await Promise.all(tasks);
    toast.success(`已移动 ${selectedUnplacedIds.value.length} 本书`);
    selectedUnplacedIds.value = [];
  } catch {
    toast.error('移动失败');
  } finally {
    isMoving.value = false;
  }
};

const handleComplete = () => {
  recentBooks.value = [];
  selectedUnplacedIds.value = [];
  emit('update:open', false);
};
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>批量录入书籍</DialogTitle>
        <DialogDescription>选择格口，扫描书籍或从待整理区移动</DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-6 py-4">
        <!-- Cell Controls -->
        <div class="flex flex-col gap-2 rounded-lg border bg-stone-50 p-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-stone-700">目标格口</span>
            <div class="flex gap-1">
              <Button size="icon" variant="outline" class="h-7 w-7" :disabled="!targetCell || targetCell.row <= 0" @click="move(-1, 0)">
                <ArrowUp class="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                class="h-7 w-7"
                :disabled="!targetCell || !store.config || targetCell.row >= store.config.rows - 1"
                @click="move(1, 0)"
              >
                <ArrowDown class="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" class="h-7 w-7" :disabled="!targetCell || targetCell.col <= 0" @click="move(0, -1)">
                <ArrowLeft class="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                class="h-7 w-7"
                :disabled="!targetCell || !store.config || targetCell.col >= store.config.cols - 1"
                @click="move(0, 1)"
              >
                <ArrowRight class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <Select v-model="selectedRow">
              <SelectTrigger>
                <SelectValue placeholder="选择行" />
              </SelectTrigger>
              <SelectContent class="max-h-60">
                <SelectItem v-for="opt in rowOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
              </SelectContent>
            </Select>

            <Select v-model="selectedCol">
              <SelectTrigger>
                <SelectValue placeholder="选择列" />
              </SelectTrigger>
              <SelectContent class="max-h-60">
                <SelectItem v-for="opt in colOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- Unplaced Books (Optional) -->
        <div v-if="targetCell && store.unplacedBooks.length > 0" class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-stone-500">待整理区 ({{ store.unplacedBooks.length }})</span>
            <Button
              size="sm"
              variant="ghost"
              class="h-6 text-xs"
              :disabled="selectedUnplacedIds.length === 0 || isMoving"
              @click="moveUnplaced"
            >
              移动选中 ({{ selectedUnplacedIds.length }})
            </Button>
          </div>
          <div class="grid max-h-32 grid-cols-1 gap-1 overflow-y-auto rounded-md border bg-white p-2">
            <label
              v-for="book in store.unplacedBooks"
              :key="book._id"
              class="flex cursor-pointer items-center gap-2 rounded p-1 text-sm hover:bg-stone-50"
            >
              <input
                v-model="selectedUnplacedIds"
                type="checkbox"
                :value="book._id"
                class="text-primary focus:ring-primary rounded border-stone-300"
              />
              <span class="flex-1 truncate">{{ book.title }}</span>
            </label>
          </div>
        </div>

        <!-- 录入区域 -->
        <div class="flex flex-col gap-2">
          <!-- 模式切换 -->
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-stone-500">录入方式</span>
            <Button size="sm" variant="ghost" class="h-7 gap-1.5 text-xs" @click="toggleMode">
              <ScanBarcode v-if="inputMode === 'manual'" class="h-3.5 w-3.5" />
              <Keyboard v-else class="h-3.5 w-3.5" />
              {{ inputMode === 'scanner' ? '切换手动输入' : '切换扫码枪' }}
            </Button>
          </div>

          <!-- 扫码枪模式 -->
          <div
            v-if="inputMode === 'scanner'"
            class="flex items-center gap-3 rounded-lg border-2 border-dashed p-4 transition-colors"
            :class="[isProcessing ? 'border-amber-400 bg-amber-50' : 'border-green-400 bg-green-50']"
          >
            <div class="flex h-10 w-10 items-center justify-center rounded-full" :class="[isProcessing ? 'bg-amber-100' : 'bg-green-100']">
              <Loader2 v-if="isProcessing" class="h-5 w-5 animate-spin text-amber-600" />
              <ScanBarcode v-else class="h-5 w-5 text-green-600" />
            </div>
            <div class="flex-1">
              <div class="text-sm font-medium" :class="[isProcessing ? 'text-amber-700' : 'text-green-700']">
                {{ isProcessing ? '正在录入...' : '扫码枪就绪' }}
              </div>
              <div class="font-mono text-xs text-stone-500">
                {{ scanBuffer || '等待扫描...' }}
              </div>
            </div>
            <div class="text-right text-xs text-stone-500">
              <div class="font-medium">目标位置</div>
              <div :class="[targetCell ? 'text-green-600' : 'text-amber-600']">
                {{ targetCell ? `${targetCell.row + 1}-${targetCell.col + 1}` : '待整理区' }}
              </div>
            </div>
          </div>

          <!-- 手动输入模式 -->
          <div v-else class="flex flex-col gap-2">
            <div class="flex gap-2">
              <Input
                ref="manualInputRef"
                v-model="manualInput"
                placeholder="请输入ISBN..."
                :disabled="isProcessing"
                class="flex-1"
                @keydown.enter="handleManualScan"
              />
              <Button :disabled="isProcessing || !manualInput.trim()" @click="handleManualScan">
                <Loader2 v-if="isProcessing" class="h-4 w-4 animate-spin" />
                <span v-else>录入</span>
              </Button>
            </div>
            <div class="text-xs text-stone-500">
              目标位置：<span :class="[targetCell ? 'text-green-600' : 'text-amber-600']">{{
                targetCell ? `${targetCell.row + 1}-${targetCell.col + 1}` : '待整理区'
              }}</span>
            </div>
          </div>
        </div>

        <!-- Recent List -->
        <div v-if="recentBooks.length > 0" class="max-h-40 overflow-y-auto rounded-md border bg-stone-50">
          <div class="text-muted-foreground border-b p-2 text-xs font-medium">本次录入记录</div>
          <div v-for="book in recentBooks" :key="book._id" class="flex items-center gap-3 border-b bg-white p-2 text-sm last:border-0">
            <div class="h-10 w-8 flex-shrink-0 overflow-hidden rounded border bg-stone-200">
              <img v-if="book.img" :src="book.img" class="h-full w-full object-cover" />
            </div>
            <div class="flex-1 truncate">
              <div class="truncate font-medium text-stone-800">{{ book.title }}</div>
              <div class="text-muted-foreground truncate text-xs">{{ book.author }}</div>
            </div>
            <Check class="h-4 w-4 text-green-600" />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="secondary" @click="handleComplete">完成</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
