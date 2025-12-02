<script setup lang="ts">
import { Settings, Lightbulb, BookOpen, List, ScanBarcode } from 'lucide-vue-next';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

defineEmits(['open-settings', 'open-led', 'open-list', 'open-entry']);
</script>

<template>
  <div class="flex items-center gap-2 rounded-full border bg-white/90 px-4 py-1.5 shadow-sm backdrop-blur transition-all hover:shadow-md">
    <div class="flex items-center gap-2 px-2">
      <BookOpen class="h-4 w-4 text-stone-800" />
      <h1 class="text-sm font-semibold text-stone-800">智能书墙</h1>
    </div>

    <div class="mx-1 h-4 w-[1px] bg-stone-200" />

    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full" @click="$emit('open-entry')">
          <ScanBarcode class="h-4 w-4 text-stone-600" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>录入书籍</TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full" @click="$emit('open-list')">
          <List class="h-4 w-4 text-stone-600" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>书籍列表</TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full" @click="$emit('open-led')">
          <Lightbulb class="h-4 w-4 text-stone-600" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>灯光控制</TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger as-child>
        <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full" @click="$emit('open-settings')">
          <Settings class="h-4 w-4 text-stone-600" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>书墙设置</TooltipContent>
    </Tooltip>
  </div>
</template>
