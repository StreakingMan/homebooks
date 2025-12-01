<script setup lang="ts">
import { Settings, Lightbulb, BookOpen, List } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip'

defineEmits(['open-settings', 'open-led', 'open-list'])
</script>

<template>
  <div class="bg-white/90 backdrop-blur shadow-sm rounded-full px-4 py-1.5 border flex items-center gap-2 transition-all hover:shadow-md">
     <div class="flex items-center gap-2 px-2">
       <BookOpen class="w-4 h-4 text-stone-800" />
       <h1 class="text-sm font-semibold text-stone-800">智能书墙</h1>
     </div>
     
     <div class="w-[1px] h-4 bg-stone-200 mx-1"/>

     <TooltipProvider>
       <Tooltip>
         <TooltipTrigger as-child>
           <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full" @click="$emit('open-list')">
             <List class="w-4 h-4 text-stone-600" />
           </Button>
         </TooltipTrigger>
         <TooltipContent>书籍列表</TooltipContent>
       </Tooltip>
     </TooltipProvider>
     
     <TooltipProvider>
       <Tooltip>
         <TooltipTrigger as-child>
           <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full" @click="$emit('open-led')">
             <Lightbulb class="w-4 h-4 text-stone-600" />
           </Button>
         </TooltipTrigger>
         <TooltipContent>灯光控制</TooltipContent>
       </Tooltip>
     </TooltipProvider>

     <TooltipProvider>
       <Tooltip>
         <TooltipTrigger as-child>
           <Button variant="ghost" size="icon" class="h-8 w-8 rounded-full" @click="$emit('open-settings')">
             <Settings class="w-4 h-4 text-stone-600" />
           </Button>
         </TooltipTrigger>
         <TooltipContent>书墙设置</TooltipContent>
       </Tooltip>
     </TooltipProvider>
  </div>
</template>

