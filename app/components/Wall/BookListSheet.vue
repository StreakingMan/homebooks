<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '~/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '~/components/ui/sheet'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Loader2, Search, Trash2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useBookStore } from '~/stores/book'

defineProps<{
  open: boolean
}>()

defineEmits(['update:open'])

const store = useBookStore()
const isDeleting = ref<string | null>(null)

// Use store directly
const isLoading = computed(() => store.isLoading)
const searchQuery = computed({
  get: () => store.searchQuery,
  set: (val) => store.setSearchQuery(val)
})

// This will reuse the same filtering logic as ChatBar
const filteredBooks = computed(() => store.filteredBooks)

const deleteBook = async (isbn?: string) => {
  if (!isbn || !confirm('确定要删除这本书吗？')) return

  isDeleting.value = isbn
  try {
    await $fetch(`/api/books/${isbn}`, { method: 'DELETE' })
    toast.success('删除成功')
    store.removeBook(isbn)
  } catch (e) {
    console.error(e)
    toast.error('删除失败')
  } finally {
    isDeleting.value = null
  }
}
</script>

<template>
  <Sheet :open="open" @update:open="$emit('update:open', $event)">
    <SheetContent side="right" class="w-full sm:max-w-2xl flex flex-col h-full p-0 gap-0">
      <div class="p-6 pb-2 border-b">
         <SheetHeader class="mb-4">
           <SheetTitle>书籍列表</SheetTitle>
           <SheetDescription>
             管理所有已录入的书籍信息。
           </SheetDescription>
         </SheetHeader>
         <div class="relative">
           <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
           <Input
             v-model="searchQuery"
             type="search"
             placeholder="搜索标题、作者、ISBN..."
             class="pl-9 w-full bg-secondary/50"
           />
         </div>
      </div>

      <div class="flex-1 overflow-auto">
        <div v-if="isLoading && filteredBooks.length === 0" class="flex items-center justify-center py-12">
           <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>

        <Table v-else>
          <TableHeader class="sticky top-0 bg-background z-10 shadow-sm">
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
                <div class="w-8 h-10 bg-stone-100 rounded overflow-hidden border">
                  <img v-if="book.img" :src="book.img" class="w-full h-full object-cover" loading="lazy" />
                </div>
              </TableCell>
              <TableCell>
                <div class="font-medium text-sm line-clamp-2" :title="book.title">{{ book.title }}</div>
                <div class="text-xs text-muted-foreground line-clamp-1">{{ book.author }}</div>
                <div class="text-[10px] text-muted-foreground font-mono mt-0.5">{{ book.isbn }}</div>
              </TableCell>
              <TableCell>
                 <div v-if="book.position" class="text-xs font-mono bg-secondary/50 px-1.5 py-0.5 rounded w-fit">
                   {{ (book.position.row ?? '?') + 1 }}-{{ (book.position.col ?? '?') + 1 }}
                 </div>
                 <span v-else class="text-xs text-muted-foreground">-</span>
              </TableCell>
              <TableCell class="text-right">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  class="h-8 w-8 text-muted-foreground hover:text-destructive"
                  :disabled="isDeleting === book.isbn"
                  @click="book.isbn && deleteBook(book.isbn)"
                >
                  <Loader2 v-if="isDeleting === book.isbn" class="h-4 w-4 animate-spin" />
                  <Trash2 v-else class="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
            <TableRow v-if="filteredBooks.length === 0 && !isLoading">
               <TableCell colspan="4" class="h-24 text-center text-muted-foreground">
                  未找到书籍
               </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </SheetContent>
  </Sheet>
</template>
