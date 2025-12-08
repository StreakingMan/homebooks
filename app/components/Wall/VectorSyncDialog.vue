<script setup lang="ts">
import { DatabaseZap, Loader2 } from 'lucide-vue-next';
import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';

defineProps<{ open: boolean }>();
const emit = defineEmits(['update:open']);

const isSyncing = ref(false);

const handleSync = async () => {
  isSyncing.value = true;
  try {
    const result = await $fetch('/api/ai/embedding/sync', {
      method: 'POST',
      body: {},
    });

    if (result.success) {
      toast.success(`同步完成：${result.synced} 本书已向量化`, {
        description: `耗时 ${result.duration}`,
      });
      emit('update:open', false);
    } else {
      toast.error('同步失败', {
        description: result.message || '请检查 ChromaDB 服务是否正常运行',
      });
    }
  } catch (error: any) {
    toast.error('同步失败', {
      description: error?.data?.message || '请检查 ChromaDB 服务是否正常运行',
    });
  } finally {
    isSyncing.value = false;
  }
};

const handleClose = () => {
  if (!isSyncing.value) {
    emit('update:open', false);
  }
};
</script>

<template>
  <Dialog :open="open" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <DatabaseZap class="h-5 w-5 text-blue-500" />
          向量库同步
        </DialogTitle>
        <DialogDescription> 将书籍数据同步到向量数据库，以启用 AI 语义搜索功能。 </DialogDescription>
      </DialogHeader>

      <div class="space-y-3 py-4 text-sm text-stone-600">
        <p>同步后可使用以下功能：</p>
        <ul class="ml-4 list-disc space-y-1 text-stone-500">
          <li>语义搜索：「找一些关于设计的书」</li>
          <li>相似推荐：「类似《人类简史》的书」</li>
          <li>智能问答：「有讲架构的书吗？」</li>
        </ul>
        <p class="text-xs text-stone-400">首次同步可能需要几十秒，取决于书籍数量。</p>
      </div>

      <DialogFooter class="gap-2 sm:gap-0">
        <Button variant="outline" :disabled="isSyncing" @click="handleClose"> 取消 </Button>
        <Button :disabled="isSyncing" @click="handleSync">
          <Loader2 v-if="isSyncing" class="mr-2 h-4 w-4 animate-spin" />
          {{ isSyncing ? '同步中...' : '开始同步' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
