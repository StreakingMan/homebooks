<template>
  <div class="camera-test">
    <div class="video-container relative">
      <video 
        ref="videoRef"
        class="w-full h-full object-cover rounded-2xl"
        autoplay 
        playsinline
        muted
      />
      
      <!-- 错误提示 -->
      <div
        v-if="error"
        class="absolute inset-0 flex items-center justify-center backdrop-blur-xl bg-white/90 dark:bg-black/90 rounded-2xl"
      >
        <div class="text-center">
          <p class="text-red-500 mb-4">{{ error }}</p>
          <button
            @click="initCamera"
            class="px-6 py-3 bg-[#007AFF] text-white rounded-xl hover:opacity-90 transition-all"
          >
            重试
          </button>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
        <button
          v-if="!isActive"
          @click="startCamera"
          class="px-6 py-3 bg-[#34C759] text-white rounded-xl hover:opacity-90 transition-all flex items-center"
        >
          <i class="mdi mdi-play mr-2"/>
          开启摄像头
        </button>
        <button
          v-else
          @click="stopCamera"
          class="px-6 py-3 bg-[#FF3B30] text-white rounded-xl hover:opacity-90 transition-all flex items-center"
        >
          <i class="mdi mdi-stop mr-2"/>
          停止摄像头
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const videoRef = ref<HTMLVideoElement | null>(null)
const error = ref('')
const isActive = ref(false)
let videoStream: MediaStream | null = null

// 初始化摄像头
async function initCamera() {
  try {
    error.value = ''
    
    // 获取摄像头权限和视频流，使用较低的分辨率和帧率
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 480 },
        height: { ideal: 360 },
        frameRate: { ideal: 10 }
      }
    }

    videoStream = await navigator.mediaDevices.getUserMedia(constraints)
    
    if (videoRef.value) {
      videoRef.value.srcObject = videoStream
      await videoRef.value.play()
      isActive.value = true
    }
  } catch (err: any) {
    handleError(err)
  }
}

// 处理错误
function handleError(err: Error) {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError') {
      error.value = '需要摄像头权限'
    } else if (err.name === 'NotFoundError') {
      error.value = '未找到摄像头设备'
    } else if (err.name === 'NotReadableError') {
      error.value = '无法访问摄像头'
    } else {
      error.value = '摄像头出现错误'
    }
  } else {
    error.value = '未知错误'
  }
  isActive.value = false
}

// 开启摄像头
const startCamera = () => {
  initCamera()
}

// 停止摄像头
function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => {
      track.stop()
    })
    videoStream = null
  }
  
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
  
  isActive.value = false
}

// 组件卸载时清理
onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
.camera-test {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}

.video-container {
  aspect-ratio: 4/3;
  background: #000;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
</style> 