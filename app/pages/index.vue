<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BookGrid from '~/components/Wall/BookGrid.vue'
import BatchEntryDialog from '~/components/Wall/BatchEntryDialog.vue'
import LedControlDialog from '~/components/Wall/LedControlDialog.vue'
import WallSettingsDialog from '~/components/Wall/WallSettingsDialog.vue'
import BookListSheet from '~/components/Wall/BookListSheet.vue'
import BookDetailDialog from '~/components/Wall/BookDetailDialog.vue'
import ChatBar from '~/components/Wall/ChatBar.vue'
import TopBar from '~/components/Wall/TopBar.vue'
import { Button } from '~/components/ui/button'
import { toast } from 'vue-sonner'
import { useBookStore } from '~/stores/book'
import { Library } from 'lucide-vue-next'

const store = useBookStore()

// Dialogs state
const showEntryDialog = ref(false)
const showLedDialog = ref(false)
const showSettingsDialog = ref(false)
const showListSheet = ref(false)
const showDetailDialog = ref(false)

// Selection state
const selectedCell = ref(null)
const selectedBook = ref(null)
const currentActiveCell = ref<{ row: number, col: number } | null>(null)

// Load data on mount
onMounted(() => {
  store.fetchAll()
})

const handleEntry = (cell: any) => {
  selectedCell.value = cell
  showEntryDialog.value = true
}

const handleLocate = async (cell: any) => {
  if (currentActiveCell.value && currentActiveCell.value.row === cell.row && currentActiveCell.value.col === cell.col) {
    currentActiveCell.value = null
  } else {
    currentActiveCell.value = { row: cell.row, col: cell.col }
    
    try {
      await $fetch('/api/led/control', {
        method: 'POST',
        body: {
          action: 'locate',
          params: { row: cell.row, col: cell.col }
        }
      })
      toast.success(`已定位: ${cell.row + 1}-${cell.col + 1}`)
    } catch (e) {
      console.error('Failed to locate', e)
      toast.error('灯光定位失败')
    }
  }
}

const handleHighlight = (pos: any) => {
  if (pos) {
    currentActiveCell.value = { row: pos.row, col: pos.col }
  } else {
    currentActiveCell.value = null
  }
}

const handleBookSelect = (book: any) => {
  selectedBook.value = book
  showDetailDialog.value = true
  if (book.position) {
     handleLocate({ row: book.position.row, col: book.position.col })
  }
}

const handleSettingsSaved = () => {
  store.fetchAll()
}
</script>

<template>
  <div class="min-h-screen bg-stone-100 flex flex-col relative font-sans overflow-hidden">
    
    <!-- Top Bar -->
    <div class="fixed top-4 left-1/2 -translate-x-1/2 z-40">
       <TopBar 
         @open-led="showLedDialog = true" 
         @open-settings="showSettingsDialog = true"
         @open-list="showListSheet = true"
       />
    </div>

    <!-- Main Wall Area -->
    <main class="flex-1 w-full h-full flex flex-col items-center justify-center p-4 pt-16 pb-24">
      <div v-if="!store.config && !store.isLoading" class="text-center flex flex-col items-center gap-4">
         <div class="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mb-2">
            <Library class="w-8 h-8 text-stone-400" />
         </div>
         <h3 class="text-lg font-medium text-stone-700">书墙未配置</h3>
         <p class="text-stone-500 text-sm max-w-xs">
           请先设置书墙的行列数和名称，以便开始管理您的书籍。
         </p>
         <Button @click="showSettingsDialog = true">立即设置</Button>
      </div>

      <BookGrid 
        v-else
        :active-cell="currentActiveCell"
        @entry="handleEntry" 
        @locate="handleLocate" 
      />
    </main>
    
    <!-- Chat Bar -->
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-50">
       <ChatBar 
         @highlight="handleHighlight"
         @select="handleBookSelect"
       />
    </div>

    <!-- Dialogs -->
    <BatchEntryDialog 
      v-model:open="showEntryDialog" 
      :cell="selectedCell"
    />
    <LedControlDialog v-model:open="showLedDialog" />
    <WallSettingsDialog v-model:open="showSettingsDialog" @saved="handleSettingsSaved" />
    <BookListSheet v-model:open="showListSheet" />
    <BookDetailDialog 
      v-model:open="showDetailDialog" 
      :book="selectedBook" 
    />
  </div>
</template>
