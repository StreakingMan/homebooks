<script setup lang="ts">
import { Loader2, Check } from 'lucide-vue-next';
import { ref, watch } from 'vue';
import { toast } from 'vue-sonner';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { useBookStore } from '~/stores/book';

const props = defineProps<{
  open: boolean;
  cell: { row: number; col: number; books: any[] } | null;
}>();

defineEmits(['update:open', 'book-added']);

const store = useBookStore();
const isbnInput = ref('');
const isProcessing = ref(false);
const recentBooks = ref<any[]>([]);

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      recentBooks.value = [];
      isbnInput.value = '';
    }
  },
);

const handleScan = async () => {
  const isbn = isbnInput.value.trim();
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
        position: { row: props.cell?.row, col: props.cell?.col },
      },
    });

    if (createRes.success) {
      toast.success(`已录入: ${createRes.book.title}`);
      recentBooks.value.unshift(createRes.book);

      // Update store directly
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
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>批量录入书籍</DialogTitle>
        <DialogDescription> 当前位置: 第 {{ (cell?.row || 0) + 1 }} 行, 第 {{ (cell?.col || 0) + 1 }} 列 </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4 py-4">
        <div class="flex gap-2">
          <Input
            v-model="isbnInput"
            placeholder="请扫描ISBN或手动输入..."
            :disabled="isProcessing"
            autofocus
            class="flex-1"
            @keydown.enter="handleScan"
          />
          <Button :disabled="isProcessing" @click="handleScan">
            <Loader2 v-if="isProcessing" class="h-4 w-4 animate-spin" />
            <span v-else>录入</span>
          </Button>
        </div>

        <!-- Recent List -->
        <div v-if="recentBooks.length > 0" class="max-h-60 overflow-y-auto rounded-md border bg-stone-50">
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
        <div v-else class="text-muted-foreground rounded-md border border-dashed bg-stone-50 py-8 text-center text-sm">
          暂无录入记录，请扫描书籍条形码
        </div>
      </div>

      <DialogFooter>
        <Button variant="secondary" @click="$emit('update:open', false)">完成</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
