<script setup lang="ts">
import { Loader2, Check, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-vue-next';
import { ref, watch, computed } from 'vue';
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
const isbnInput = ref('');
const isProcessing = ref(false);
const recentBooks = ref<any[]>([]);

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
      isbnInput.value = '';
      selectedUnplacedIds.value = [];
      if (props.cell) {
        selectedRow.value = String(props.cell.row);
        selectedCol.value = String(props.cell.col);
      } else {
        selectedRow.value = '';
        selectedCol.value = '';
      }
    } else {
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

const handleScan = async () => {
  const isbn = isbnInput.value.trim();
  if (!isbn) return;
  if (!targetCell.value) {
    toast.error('请先选择格口位置');
    return;
  }

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
        position: { row: targetCell.value.row, col: targetCell.value.col },
      },
    });

    if (createRes.success) {
      toast.success(`已录入: ${createRes.book.title}`);
      recentBooks.value.unshift(createRes.book);
      store.addBook(createRes.book);
      isbnInput.value = '';
    }
  } catch (e) {
    toast.error('录入失败或未找到书籍');
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

        <div class="flex gap-2">
          <Input
            v-model="isbnInput"
            placeholder="请扫描ISBN或手动输入..."
            :disabled="isProcessing || !targetCell"
            autofocus
            class="flex-1"
            @keydown.enter="handleScan"
          />
          <Button :disabled="isProcessing || !targetCell" @click="handleScan">
            <Loader2 v-if="isProcessing" class="h-4 w-4 animate-spin" />
            <span v-else>录入</span>
          </Button>
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
