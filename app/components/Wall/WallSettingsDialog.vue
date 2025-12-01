<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { toast } from 'vue-sonner'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits(['update:open', 'saved'])

const form = ref({ name: '', rows: 7, cols: 8 })

const fetchConfig = async () => {
  try {
    const res: any = await $fetch('/api/wall/config')
    if (res.config) {
      form.value = { 
        name: res.config.name,
        rows: res.config.rows,
        cols: res.config.cols
      }
    }
  } catch (e) {
    console.error(e)
  }
}

watch(() => props.open, (val) => {
  if (val) fetchConfig()
})

onMounted(fetchConfig)

const save = async () => {
  try {
    await $fetch('/api/wall/config', {
      method: 'POST',
      body: form.value
    })
    toast.success('设置已保存')
    emit('saved')
    emit('update:open', false)
  } catch {
    toast.error('保存失败')
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>书墙设置</DialogTitle>
        <DialogDescription>配置书墙的基本信息和布局尺寸。</DialogDescription>
      </DialogHeader>
      
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <label class="text-right text-sm font-medium">名称</label>
          <Input v-model="form.name" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <label class="text-right text-sm font-medium">行数 (Rows)</label>
          <Input v-model.number="form.rows" type="number" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <label class="text-right text-sm font-medium">列数 (Cols)</label>
          <Input v-model.number="form.cols" type="number" class="col-span-3" />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">取消</Button>
        <Button @click="save">保存</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

