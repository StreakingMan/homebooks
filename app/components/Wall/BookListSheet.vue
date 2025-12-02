<script setup lang="ts">
import { Loader2, Search, Trash2 } from 'lucide-vue-next';
import { ref, computed } from 'vue';
import { toast } from 'vue-sonner';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '~/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { useBookStore } from '~/stores/book';

defineProps<{
  open: boolean;
}>();

defineEmits(['update:open']);

const store = useBookStore();
const isDeleting = ref<string | null>(null);

// Use store directly
const isLoading = computed(() => store.isLoading);
const searchQuery = computed({
  get: () => store.searchQuery,
  set: (val) => store.setSearchQuery(val),
});

// This will reuse the same filtering logic as ChatBar
const filteredBooks = computed(() => store.filteredBooks);

const deleteBook = async (isbn?: string) => {
  if (!isbn || !confirm('确定要删除这本书吗？')) return;

  isDeleting.value = isbn;
  try {
    await $fetch(`/api/books/${isbn}`, { method: 'DELETE' });
    toast.success('删除成功');
    store.removeBook(isbn);
  } catch (e) {
    console.error(e);
    toast.error('删除失败');
  } finally {
    isDeleting.value = null;
  }
};
</script>

<template>
  <Sheet :open="open" @update:open="$emit('update:open', $event)">
    <SheetContent side="right" class="flex h-full w-full flex-col gap-0 p-0 sm:max-w-2xl">
      <div class="border-b p-6 pb-2">
        <SheetHeader class="mb-4">
          <SheetTitle>书籍列表</SheetTitle>
          <SheetDescription> 管理所有已录入的书籍信息。 </SheetDescription>
        </SheetHeader>
        <div class="relative">
          <Search class="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input v-model="searchQuery" type="search" placeholder="搜索标题、作者、ISBN..." class="bg-secondary/50 w-full pl-9" />
        </div>
      </div>

      <div class="flex-1 overflow-auto">
        <div v-if="isLoading && filteredBooks.length === 0" class="flex items-center justify-center py-12">
          <Loader2 class="text-muted-foreground h-8 w-8 animate-spin" />
        </div>

        <Table v-else>
          <TableHeader class="bg-background sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead class="w-[60px]">封面</TableHead>
              <TableHead class="min-w-[150px]">书名</TableHead>
              <TableHead>位置</TableHead>
              <TableHead class="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="book in filteredBooks" :key="book._id">
              <TableCell>
                <div class="h-10 w-8 overflow-hidden rounded border bg-stone-100">
                  <img v-if="book.img" :src="book.img" class="h-full w-full object-cover" loading="lazy" />
                </div>
              </TableCell>
              <TableCell>
                <div class="line-clamp-2 text-sm font-medium" :title="book.title">{{ book.title }}</div>
                <div class="text-muted-foreground line-clamp-1 text-xs">{{ book.author }}</div>
                <div class="text-muted-foreground mt-0.5 font-mono text-[10px]">{{ book.isbn }}</div>
              </TableCell>
              <TableCell>
                <div v-if="book.position" class="bg-secondary/50 w-fit rounded px-1.5 py-0.5 font-mono text-xs">
                  {{ (book.position.row ?? '?') + 1 }}-{{ (book.position.col ?? '?') + 1 }}
                </div>
                <span v-else class="text-muted-foreground text-xs">-</span>
              </TableCell>
              <TableCell class="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  class="text-muted-foreground hover:text-destructive h-8 w-8"
                  :disabled="isDeleting === book.isbn"
                  @click="book.isbn && deleteBook(book.isbn)"
                >
                  <Loader2 v-if="isDeleting === book.isbn" class="h-4 w-4 animate-spin" />
                  <Trash2 v-else class="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow v-if="filteredBooks.length === 0 && !isLoading">
              <TableCell colspan="4" class="text-muted-foreground h-24 text-center"> 未找到书籍 </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </SheetContent>
  </Sheet>
</template>
