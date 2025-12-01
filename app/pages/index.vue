<script setup lang="ts">
import { Library } from 'lucide-vue-next';
import { ref, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import BatchEntryDialog from '~/components/Wall/BatchEntryDialog.vue';
import BookDetailDialog from '~/components/Wall/BookDetailDialog.vue';
import BookGrid from '~/components/Wall/BookGrid.vue';
import BookListSheet from '~/components/Wall/BookListSheet.vue';
import ChatBar from '~/components/Wall/ChatBar.vue';
import LedControlDialog from '~/components/Wall/LedControlDialog.vue';
import TopBar from '~/components/Wall/TopBar.vue';
import WallSettingsDialog from '~/components/Wall/WallSettingsDialog.vue';
import { Button } from '~/components/ui/button';
import { useBookStore } from '~/stores/book';

const store = useBookStore();

// Dialogs state
const showEntryDialog = ref(false);
const showLedDialog = ref(false);
const showSettingsDialog = ref(false);
const showListSheet = ref(false);
const showDetailDialog = ref(false);

// Selection state
const selectedCell = ref(null);
const selectedBook = ref(null);
const currentActiveCell = ref<{ row: number; col: number } | null>(null);

// Load data on mount
onMounted(() => {
  store.fetchAll();
});

const handleEntry = (cell: any) => {
  selectedCell.value = cell;
  showEntryDialog.value = true;
};

const handleLocate = async (cell: any) => {
  if (currentActiveCell.value && currentActiveCell.value.row === cell.row && currentActiveCell.value.col === cell.col) {
    currentActiveCell.value = null;
  } else {
    currentActiveCell.value = { row: cell.row, col: cell.col };

    try {
      await $fetch('/api/led/control', {
        method: 'POST',
        body: {
          action: 'locate',
          params: { row: cell.row, col: cell.col },
        },
      });
      toast.success(`已定位: ${cell.row + 1}-${cell.col + 1}`);
    } catch (e) {
      console.error('Failed to locate', e);
      toast.error('灯光定位失败');
    }
  }
};

const handleHighlight = (pos: any) => {
  if (pos) {
    currentActiveCell.value = { row: pos.row, col: pos.col };
  } else {
    currentActiveCell.value = null;
  }
};

const handleBookSelect = (book: any) => {
  selectedBook.value = book;
  showDetailDialog.value = true;
  if (book.position) {
    handleLocate({ row: book.position.row, col: book.position.col });
  }
};

const handleSettingsSaved = () => {
  store.fetchAll();
};
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-hidden bg-stone-100 font-sans">
    <!-- Top Bar -->
    <div class="fixed top-4 left-1/2 z-40 -translate-x-1/2">
      <TopBar @open-led="showLedDialog = true" @open-settings="showSettingsDialog = true" @open-list="showListSheet = true" />
    </div>

    <!-- Main Wall Area -->
    <main class="flex h-full w-full flex-1 flex-col items-center justify-center p-4 pt-16 pb-24">
      <div v-if="!store.config && !store.isLoading" class="flex flex-col items-center gap-4 text-center">
        <div class="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-stone-200">
          <Library class="h-8 w-8 text-stone-400" />
        </div>
        <h3 class="text-lg font-medium text-stone-700">书墙未配置</h3>
        <p class="max-w-xs text-sm text-stone-500">请先设置书墙的行列数和名称，以便开始管理您的书籍。</p>
        <Button @click="showSettingsDialog = true">立即设置</Button>
      </div>

      <BookGrid v-else :active-cell="currentActiveCell" @entry="handleEntry" @locate="handleLocate" />
    </main>

    <!-- Chat Bar -->
    <div class="fixed bottom-6 left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4">
      <ChatBar @highlight="handleHighlight" @select="handleBookSelect" />
    </div>

    <!-- Dialogs -->
    <BatchEntryDialog v-model:open="showEntryDialog" :cell="selectedCell" />
    <LedControlDialog v-model:open="showLedDialog" />
    <WallSettingsDialog v-model:open="showSettingsDialog" @saved="handleSettingsSaved" />
    <BookListSheet v-model:open="showListSheet" />
    <BookDetailDialog v-model:open="showDetailDialog" :book="selectedBook" />
  </div>
</template>
