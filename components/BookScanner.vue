<template>
  <div class="book-scanner">
    <!-- 调试日志区域 -->
    <div class="debug-panel mb-6 backdrop-blur-xl bg-white/10 dark:bg-black/10 rounded-2xl p-6 shadow-lg">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-base font-medium text-gray-900 dark:text-white">调试日志</h3>
        <div class="flex items-center space-x-3">
          <button
            type="button"
            @click="retryCamera"
            class="text-sm px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:opacity-90 transition-opacity duration-300"
          >
            重试摄像头
          </button>
          <button
            type="button"
            @click="logs = []"
            class="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full hover:opacity-90 transition-opacity duration-300"
          >
            清除日志
          </button>
        </div>
      </div>
      <div class="debug-log">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="log-item"
          :class="log.type"
        >
          {{ log.time }} - {{ log.message }}
        </div>
        <div v-if="logs.length === 0" class="text-gray-500 dark:text-gray-400 text-sm">
          等待扫描...
        </div>
      </div>
    </div>

    <div class="scanner-container relative">
      <div v-if="!cameraError" class="video-container">
        <video 
          ref="videoRef"
          class="rounded-2xl"
          autoplay 
          playsinline
          muted
        />
        <canvas ref="canvasRef" class="hidden" />
        
        <div class="overlay absolute inset-0 border-2 border-gray-900 dark:border-white rounded-2xl" />
        
        <!-- 扫描状态提示 -->
        <div
          v-if="scanStatus"
          class="scan-status backdrop-blur-xl bg-white/80 dark:bg-black/80"
        >
          {{ scanStatus }}
        </div>
      </div>

      <div v-else class="camera-error backdrop-blur-xl bg-white/90 dark:bg-black/90">
        <p class="text-red-500 mb-4 text-lg">{{ cameraError }}</p>
        <button
          @click="retryCamera"
          class="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-base hover:opacity-90 transition-opacity duration-300"
        >
          重试
        </button>
      </div>
      
      <!-- 错误提示 -->
      <div
        v-if="error"
        class="error-message backdrop-blur-xl bg-red-500/90"
      >
        {{ error }}
      </div>
      
      <!-- 加载状态 -->
      <div
        v-if="loading"
        class="loading-overlay backdrop-blur-xl bg-white/80 dark:bg-black/80"
      >
        <div class="spinner" />
        <p class="mt-4 text-gray-900 dark:text-white text-base">{{ loadingMessage }}</p>
      </div>
    </div>

    <!-- 预览区域 -->
    <div
      v-if="previewBook"
      class="preview-container mt-6 backdrop-blur-xl bg-white/90 dark:bg-black/90 rounded-2xl p-4 shadow-lg"
    >
      <div class="flex items-center space-x-4">
        <div class="w-16 h-24 flex-shrink-0">
          <img
            v-if="previewBook.img"
            :src="previewBook.img"
            :alt="previewBook.title"
            class="w-full h-full object-cover rounded-lg shadow"
          />
          <div
            v-else
            class="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg shadow flex items-center justify-center"
          >
            <span class="text-gray-400 dark:text-gray-500 text-xs">无图片</span>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-medium text-gray-900 dark:text-white truncate">
            {{ previewBook.title }}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
            {{ previewBook.author }}
          </p>
          <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {{ previewBook.isbn }}
          </p>
        </div>
      </div>
    </div>

    <!-- 已扫描书籍列表 -->
    <div v-if="scannedBooks.length > 0" class="mt-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-base font-medium text-gray-900 dark:text-white">已扫描书籍</h3>
        <span class="text-sm text-gray-500 dark:text-gray-400">共 {{ scannedBooks.length }} 本</span>
      </div>
      <div class="space-y-4">
        <div
          v-for="book in scannedBooks"
          :key="book.isbn"
          class="backdrop-blur-xl bg-white/90 dark:bg-black/90 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 flex items-center space-x-4"
        >
          <div class="w-16 h-24 flex-shrink-0">
            <img
              v-if="book.img"
              :src="book.img"
              :alt="book.title"
              class="w-full h-full object-cover rounded-lg shadow"
            />
            <div
              v-else
              class="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg shadow flex items-center justify-center"
            >
              <span class="text-gray-400 dark:text-gray-500 text-xs">无图片</span>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="text-base font-medium text-gray-900 dark:text-white truncate">
              {{ book.title }}
            </h4>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 truncate">
              {{ book.author }}
            </p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {{ book.isbn }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library'

interface CameraError extends Error {
  name: string;
}

interface Book {
  title: string;
  isbn: string;
  author: string;
  publisher: string;
  pubdate: string;
  img: string;
  summary: string;
}

const emit = defineEmits<{
  'scan-success': [book: Book]
  'scan-error': [message: string]
}>()

const errorMsg = ref('')
const loading = ref(false)
const loadingMessage = ref('正在初始化摄像头...')
const scanStatus = ref('')
const previewBook = ref<Book | null>(null)
const cameraError = ref<string | null>(null)

// 视频和画布引用
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

// 条码读取器
let codeReader: BrowserMultiFormatReader | null = null
let videoStream: MediaStream | null = null

interface LogItem {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

const logs = ref<LogItem[]>([])
const error = computed(() => errorMsg.value)

// 添加缓存和状态控制
const scannedISBNs = new Set<string>() // 已扫描过的ISBN缓存
const pendingISBNs = new Set<string>() // 正在请求中的ISBN
const lastScannedTime = ref(0) // 上次成功扫描的时间戳
const scanCooldown = 2000 // 扫描冷却时间（毫秒）

// 已扫描书籍列表
const scannedBooks = ref<Book[]>([])

// 添加日志的辅助函数
function addLog(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  logs.value.unshift({ time, message, type })
  if (logs.value.length > 10) {
    logs.value.pop()
  }
}

// 初始化摄像头
async function initCamera() {
  try {
    addLog('正在初始化摄像头...', 'info')
    loading.value = true
    cameraError.value = null

    // 创建条码读取器
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8])
    hints.set(DecodeHintType.TRY_HARDER, true)
    codeReader = new BrowserMultiFormatReader(hints, 500) // 设置超时时间为500ms

    // 获取摄像头权限和视频流
    const constraints = {
      video: {
        facingMode: 'environment',
        width: { ideal: 640 }, // 降低分辨率
        height: { ideal: 480 },
        frameRate: { ideal: 15 }, // 降低帧率
        aspectRatio: { ideal: 4/3 }
      }
    }

    videoStream = await navigator.mediaDevices.getUserMedia(constraints)
    
    if (videoRef.value) {
      videoRef.value.srcObject = videoStream
      await videoRef.value.play()
      
      // 开始扫描
      startScanning()
    }

    addLog('摄像头初始化成功', 'success')
  } catch (error: unknown) {
    console.error('Camera initialization error:', error)
    handleCameraError(error as CameraError)
  } finally {
    loading.value = false
  }
}

// 处理摄像头错误
function handleCameraError(err: Error) {
  let errorMessage = '无法启动摄像头'
  
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError') {
      errorMessage = '需要摄像头权限来扫描二维码'
      addLog('请在浏览器中允许使用摄像头', 'warning')
    } else if (err.name === 'NotFoundError') {
      errorMessage = '未找到摄像头设备'
      addLog('请确保设备已连接摄像头', 'warning')
    } else if (err.name === 'NotSupportedError') {
      errorMessage = '您的设备不支持摄像头API'
      addLog('请使用支持WebRTC的现代浏览器', 'warning')
    } else if (err.name === 'NotReadableError') {
      errorMessage = '无法访问摄像头'
      addLog('摄像头可能被其他应用程序占用', 'warning')
    } else {
      addLog(`未知错误: ${err.message}`, 'error')
    }
  } else {
    addLog(`未知错误: ${err.message}`, 'error')
  }
  
  errorMsg.value = errorMessage
  cameraError.value = errorMessage
  addLog(errorMessage, 'error')
  emit('scan-error', errorMsg.value)
}

// 开始扫描
function startScanning() {
  if (!videoRef.value || !canvasRef.value || !codeReader) return

  const canvas = canvasRef.value
  const video = videoRef.value
  const context = canvas.getContext('2d')
  if (!context) return

  let animationFrameId: number | null = null
  let lastScanTime = 0
  const scanInterval = 200 // 每200ms扫描一次
  
  // 设置画布大小
  canvas.width = 640
  canvas.height = 480

  // 定期扫描画面
  const scan = async () => {
    if (!context || !video || !codeReader) {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      return
    }

    const now = performance.now()
    if (now - lastScanTime >= scanInterval) {
      try {
        // 绘制视频帧
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // 直接从视频元素解码
        const result = await codeReader.decodeFromVideo(video)
        
        if (result?.getText()) {
          handleDecode(result.getText())
        }
      } catch {
        // 忽略解码失败的错误
      }
      lastScanTime = now
    }

    // 继续下一帧扫描
    if (!loading.value) {
      animationFrameId = requestAnimationFrame(scan)
    } else if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
  }

  // 开始扫描循环
  animationFrameId = requestAnimationFrame(scan)
  
  // 返回清理函数
  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }
  }
}

// 处理解码结果
async function handleDecode(decodedString: string) {
  // 检查是否是有效的ISBN码
  const isbn = decodedString.replace(/[^0-9X]/gi, '')
  if (isbn.length !== 10 && isbn.length !== 13) {
    console.log('Invalid ISBN:', isbn)
    return
  }

  // 检查扫描冷却时间
  const now = Date.now()
  if (now - lastScannedTime.value < scanCooldown) {
    return
  }
  
  // 检查是否正在请求中
  if (pendingISBNs.has(isbn)) {
    console.log('ISBN request pending:', isbn)
    return
  }
  
  // 检查是否已经扫描过
  if (scannedISBNs.has(isbn)) {
    console.log('ISBN already scanned:', isbn)
    return
  }

  console.log('Valid ISBN found:', isbn)
  addLog(`识别到ISBN：${isbn}`, 'success')
  scanStatus.value = '已识别ISBN：' + isbn
  loading.value = true
  loadingMessage.value = '正在获取图书信息...'
  
  // 添加到正在请求的集合中
  pendingISBNs.add(isbn)
  
  try {
    addLog('正在获取图书信息...', 'info')
    const response = await fetch(`/api/books/${isbn}`)
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || '获取图书信息失败')
    }
    
    console.log('Book data received:', data)
    previewBook.value = data
    // 添加到已扫描列表
    scannedBooks.value.unshift(data)
    scanStatus.value = '扫描成功！'
    addLog(`获取成功：《${data.title}》`, 'success')
    
    // 更新扫描时间戳和缓存
    lastScannedTime.value = now
    scannedISBNs.add(isbn)
    emit('scan-success', data)
  } catch (error: unknown) {
    console.error('API error:', error)
    const e = error as Error
    errorMsg.value = e.message
    scanStatus.value = ''
    previewBook.value = null
    addLog(e.message, 'error')
    emit('scan-error', errorMsg.value)
  } finally {
    loading.value = false
    // 从正在请求的集合中移除
    pendingISBNs.delete(isbn)
  }
}

// 重试摄像头时清除缓存
const retryCamera = () => {
  addLog('正在重试摄像头...', 'info')
  // 清除缓存
  scannedISBNs.clear()
  pendingISBNs.clear()
  lastScannedTime.value = 0
  scannedBooks.value = []
  
  // 完全停止摄像头
  stopCamera()
  
  // 短暂延迟后重新初始化
  setTimeout(() => {
    initCamera()
  }, 500)
}

// 停止摄像头
function stopCamera() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => {
      track.stop()
      track.enabled = false
    })
    videoStream = null
  }
  
  if (codeReader) {
    codeReader.reset()
    codeReader = null
  }
  
  if (videoRef.value) {
    const video = videoRef.value
    video.srcObject = null
    video.load() // 强制释放视频资源
  }
  
  if (canvasRef.value) {
    const canvas = canvasRef.value
    const context = canvas.getContext('2d')
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  }
}

// 组件挂载时初始化
onMounted(() => {
  addLog('组件已挂载，准备初始化摄像头...', 'info')
  initCamera()
})

// 组件卸载时清理
onUnmounted(() => {
  addLog('组件正在卸载...', 'info')
  stopCamera()
  // 清除缓存
  scannedISBNs.clear()
  pendingISBNs.clear()
  scannedBooks.value = []
  
  // 强制进行垃圾回收
  if (window.gc) {
    window.gc()
  }
})
</script>

<style scoped>
.book-scanner {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px;
}

.scanner-container {
  aspect-ratio: 4/3;
  background: #000;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.overlay {
  pointer-events: none;
  transition: border-color 0.3s ease;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: currentColor;
  animation: spin 0.8s linear infinite;
}

.error-message {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.scan-status {
  position: absolute;
  top: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  color: inherit;
  padding: 0.75rem 1.5rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  z-index: 10;
  transition: all 0.3s ease;
}

.preview-container {
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(1.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.debug-panel {
  transition: all 0.3s ease;
}

.debug-log {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.75rem;
  padding: 1rem;
  max-height: 180px;
  overflow-y: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  transition: all 0.3s ease;
}

.dark .debug-log {
  background: rgba(255, 255, 255, 0.05);
}

.debug-log::-webkit-scrollbar {
  width: 6px;
}

.debug-log::-webkit-scrollbar-track {
  background: transparent;
}

.debug-log::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.dark .debug-log::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}

.debug-log::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.dark .debug-log::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

.log-item {
  margin: 3px 0;
  padding: 3px 6px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-break: break-all;
  transition: all 0.2s ease;
}

.log-item.info {
  color: #0066cc;
}

.dark .log-item.info {
  color: #5e9eff;
}

.log-item.success {
  color: #28cd41;
}

.dark .log-item.success {
  color: #32d74b;
}

.log-item.warning {
  color: #ff9f0a;
}

.dark .log-item.warning {
  color: #ffd60a;
}

.log-item.error {
  color: #ff3b30;
}

.dark .log-item.error {
  color: #ff453a;
}

.camera-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  transition: all 0.3s ease;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 640px) {
  .book-scanner {
    padding: 0 16px;
  }
  
  .debug-panel {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .preview-container {
    padding: 1rem;
  }
}
</style> 