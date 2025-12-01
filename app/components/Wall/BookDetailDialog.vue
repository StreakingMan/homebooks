<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Calendar, MapPin, Hash, User, Book as BookIcon } from 'lucide-vue-next'

defineProps<{
  open: boolean
  book: any
}>()

defineEmits(['update:open'])
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-2xl p-0 overflow-hidden gap-0">
       <div class="flex flex-col sm:flex-row h-[600px] sm:h-[400px]">
          <!-- Cover Image Section -->
          <div class="w-full sm:w-1/3 bg-stone-100 relative overflow-hidden group">
             <div class="absolute inset-0 flex items-center justify-center">
                <img 
                  v-if="book?.img" 
                  :src="book.img" 
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  alt="Book Cover" 
                />
                <div v-else class="flex flex-col items-center text-stone-300">
                   <BookIcon class="w-16 h-16 mb-2" />
                   <span class="text-xs">暂无封面</span>
                </div>
             </div>
             <!-- Gradient Overlay -->
             <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 sm:opacity-30" />
          </div>

          <!-- Details Section -->
          <div class="flex-1 p-6 flex flex-col overflow-y-auto">
             <DialogHeader class="mb-4 text-left">
               <div class="flex items-start justify-between gap-2">
                 <DialogTitle class="text-xl sm:text-2xl font-serif leading-tight text-stone-800">
                    {{ book?.title || '未命名书籍' }}
                 </DialogTitle>
                 <Badge v-if="book?.position" variant="secondary" class="shrink-0 bg-green-100 text-green-700 hover:bg-green-200">
                    <MapPin class="w-3 h-3 mr-1" />
                    {{ (book.position.row ?? 0) + 1 }} - {{ (book.position.col ?? 0) + 1 }}
                 </Badge>
               </div>
               <DialogDescription class="text-stone-500 mt-1 flex items-center gap-2 text-sm">
                  <User class="w-3 h-3" /> {{ book?.author || '佚名' }}
               </DialogDescription>
             </DialogHeader>

             <div class="space-y-4 flex-1">
                <!-- Tags/Meta -->
                <div class="flex flex-wrap gap-2">
                   <Badge variant="outline" class="text-xs font-normal text-stone-500 border-stone-200">
                      <Hash class="w-3 h-3 mr-1 opacity-50" /> {{ book?.isbn || 'No ISBN' }}
                   </Badge>
                   <Badge v-if="book?.publisher" variant="outline" class="text-xs font-normal text-stone-500 border-stone-200">
                      出版社: {{ book.publisher }}
                   </Badge>
                   <Badge v-if="book?.pubdate" variant="outline" class="text-xs font-normal text-stone-500 border-stone-200">
                      <Calendar class="w-3 h-3 mr-1 opacity-50" /> {{ book.pubdate }}
                   </Badge>
                </div>

                <!-- Summary -->
                <div class="text-sm text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-md border border-stone-100 h-full max-h-[150px] overflow-y-auto scrollbar-thin">
                   {{ book?.summary || '暂无简介...' }}
                </div>
             </div>

             <DialogFooter class="mt-6 sm:justify-between items-center border-t pt-4">
                <div class="text-xs text-muted-foreground">
                   <!-- Optional ID or Status -->
                </div>
                <Button variant="secondary" @click="$emit('update:open', false)">关闭</Button>
             </DialogFooter>
          </div>
       </div>
    </DialogContent>
  </Dialog>
</template>

