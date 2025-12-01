<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Power } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

defineProps<{ open: boolean }>()
defineEmits(['update:open'])

const move = async (direction: string) => {
  try {
    await $fetch('/api/led/control', {
      method: 'POST',
      body: { action: 'move', params: { direction } }
    })
    toast.success(`移动: ${direction}`)
  } catch {
    toast.error('操作失败')
  }
}

const toggle = async () => {
  try {
     await $fetch('/api/led/control', {
      method: 'POST',
      body: { action: 'toggle', params: { state: true } }
    })
    toast.success('灯光切换')
  } catch {
    toast.error('操作失败')
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="sm:max-w-xs">
      <DialogHeader>
        <DialogTitle class="text-center">灯光控制器</DialogTitle>
      </DialogHeader>
      <div class="flex flex-col items-center gap-4 py-4">
         <div class="grid grid-cols-3 gap-2">
           <div />
           <Button size="icon" variant="outline" @click="move('up')"><ArrowUp class="w-4 h-4" /></Button>
           <div />
           
           <Button size="icon" variant="outline" @click="move('left')"><ArrowLeft class="w-4 h-4" /></Button>
           <Button size="icon" variant="default" class="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20" @click="toggle"><Power class="w-4 h-4" /></Button>
           <Button size="icon" variant="outline" @click="move('right')"><ArrowRight class="w-4 h-4" /></Button>
           
           <div />
           <Button size="icon" variant="outline" @click="move('down')"><ArrowDown class="w-4 h-4" /></Button>
           <div />
         </div>
         <p class="text-xs text-muted-foreground mt-2">使用方向键控制灯光移动</p>
      </div>
    </DialogContent>
  </Dialog>
</template>

