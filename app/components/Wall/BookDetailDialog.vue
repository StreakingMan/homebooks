<script setup lang="ts">
import { Calendar, MapPin, Hash, User, Book as BookIcon } from 'lucide-vue-next';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog';

defineProps<{
  open: boolean;
  book: any;
}>();

defineEmits(['update:open']);
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="gap-0 overflow-hidden p-0 sm:max-w-2xl">
      <div class="flex h-[600px] flex-col sm:h-[400px] sm:flex-row">
        <!-- Cover Image Section -->
        <div class="group relative w-full overflow-hidden bg-stone-100 sm:w-1/3">
          <div class="absolute inset-0 flex items-center justify-center">
            <img
              v-if="book?.img"
              :src="book.img"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              alt="Book Cover"
            />
            <div v-else class="flex flex-col items-center text-stone-300">
              <BookIcon class="mb-2 h-16 w-16" />
              <span class="text-xs">暂无封面</span>
            </div>
          </div>
          <!-- Gradient Overlay -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 sm:opacity-30" />
        </div>

        <!-- Details Section -->
        <div class="flex flex-1 flex-col overflow-y-auto p-6">
          <DialogHeader class="mb-4 text-left">
            <div class="flex items-start justify-between gap-2">
              <DialogTitle class="font-serif text-xl leading-tight text-stone-800 sm:text-2xl">
                {{ book?.title || '未命名书籍' }}
              </DialogTitle>
              <Badge v-if="book?.position" variant="secondary" class="shrink-0 bg-green-100 text-green-700 hover:bg-green-200">
                <MapPin class="mr-1 h-3 w-3" />
                {{ (book.position.row ?? 0) + 1 }} - {{ (book.position.col ?? 0) + 1 }}
              </Badge>
            </div>
            <DialogDescription class="mt-1 flex items-center gap-2 text-sm text-stone-500">
              <User class="h-3 w-3" /> {{ book?.author || '佚名' }}
            </DialogDescription>
          </DialogHeader>

          <div class="flex-1 space-y-4">
            <!-- Tags/Meta -->
            <div class="flex flex-wrap gap-2">
              <Badge variant="outline" class="border-stone-200 text-xs font-normal text-stone-500">
                <Hash class="mr-1 h-3 w-3 opacity-50" /> {{ book?.isbn || 'No ISBN' }}
              </Badge>
              <Badge v-if="book?.publisher" variant="outline" class="border-stone-200 text-xs font-normal text-stone-500">
                出版社: {{ book.publisher }}
              </Badge>
              <Badge v-if="book?.pubdate" variant="outline" class="border-stone-200 text-xs font-normal text-stone-500">
                <Calendar class="mr-1 h-3 w-3 opacity-50" /> {{ book.pubdate }}
              </Badge>
            </div>

            <!-- Summary -->
            <div
              class="scrollbar-thin h-full max-h-[150px] overflow-y-auto rounded-md border border-stone-100 bg-stone-50 p-3 text-sm leading-relaxed text-stone-600"
            >
              {{ book?.summary || '暂无简介...' }}
            </div>
          </div>

          <DialogFooter class="mt-6 items-center border-t pt-4 sm:justify-between">
            <div class="text-muted-foreground text-xs">
              <!-- Optional ID or Status -->
            </div>
            <Button variant="secondary" @click="$emit('update:open', false)">关闭</Button>
          </DialogFooter>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
