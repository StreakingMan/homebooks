<template>
  <div class="min-h-screen bg-[#f5f5f7] dark:bg-[#000000] relative overflow-hidden">
    <!-- iOS 风格背景 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute inset-0 bg-gradient-to-br from-[#5856D6]/10 via-[#007AFF]/5 to-[#34C759]/10 dark:from-[#5856D6]/20 dark:via-[#007AFF]/10 dark:to-[#34C759]/20 backdrop-blur-3xl opacity-60"/>
    </div>

    <!-- 内容区域 -->
    <div class="relative z-10 container mx-auto px-6 py-8 max-w-6xl">
      <!-- 头部区域 -->
      <header class="text-center mb-8">
        <h1 class="text-5xl md:text-6xl font-bold tracking-tight text-[#1D1D1F] dark:text-white mb-4">
          我的书墙
        </h1>
        <p class="text-lg md:text-xl text-[#86868B] dark:text-[#86868B] font-normal max-w-2xl mx-auto leading-relaxed mb-8">
          记录阅读足迹，分享知识力量
        </p>

        <!-- 搜索区域 -->
        <div class="max-w-2xl mx-auto space-y-4">
          <div class="relative group">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索书名、作者或出版社..."
              class="w-full px-6 py-4 backdrop-blur-2xl bg-white/70 dark:bg-[#1C1C1E]/70 rounded-2xl shadow-sm group-hover:shadow-lg outline-none transition-all duration-300 text-[#1D1D1F] dark:text-white text-base placeholder-[#86868B]"
            />
            <div class="absolute right-6 top-1/2 -translate-y-1/2 text-[#86868B]">
              <i class="mdi mdi-magnify text-xl"/>
            </div>
          </div>
          
          <!-- iOS 风格扫码按钮 -->
          <div class="flex gap-4">
            <button
              class="flex-1 flex items-center justify-center px-6 py-4 bg-[#007AFF] dark:bg-[#0A84FF] text-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-base font-medium"
              @click="showScanner = true"
            >
              <i class="mdi mdi-barcode-scan text-xl mr-2 group-hover:scale-110 transition-transform"/>
              扫码枪录入
            </button>
            <button
              class="flex-1 flex items-center justify-center px-6 py-4 bg-[#34C759] dark:bg-[#32D74B] text-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-base font-medium"
              @click="showCameraScanner = true"
            >
              <i class="mdi mdi-camera text-xl mr-2 group-hover:scale-110 transition-transform"/>
              摄像头扫描
            </button>
          </div>
        </div>
        
        <!-- iOS 风格主题切换按钮 -->
        <button
          class="fixed top-8 right-8 p-4 backdrop-blur-2xl bg-white/70 dark:bg-[#1C1C1E]/70 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group z-50"
          :title="isDarkMode ? '切换到浅色模式' : '切换到深色模式'"
          @click="toggleColorMode"
        >
          <i class="mdi mdi-white-balance-sunny text-2xl text-[#FF9F0A] rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0"/>
          <i class="mdi mdi-moon-waning-crescent absolute top-4 left-4 text-2xl text-[#5856D6] rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100"/>
        </button>
      </header>

      <!-- 统计信息和HA控制区域 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <!-- 统计信息卡片 -->
        <div class="backdrop-blur-2xl bg-white/70 dark:bg-[#1C1C1E]/70 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300">
          <div class="text-3xl md:text-4xl font-bold text-[#007AFF] dark:text-[#0A84FF] mb-2">
            {{ books?.length || 0 }}
          </div>
          <div class="text-sm text-[#86868B] dark:text-[#86868B] font-medium">总藏书量</div>
        </div>
        <div class="backdrop-blur-2xl bg-white/70 dark:bg-[#1C1C1E]/70 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300">
          <div class="text-3xl md:text-4xl font-bold text-[#34C759] dark:text-[#32D74B] mb-2">
            {{ getNewBooksCount() }}
          </div>
          <div class="text-sm text-[#86868B] dark:text-[#86868B] font-medium">本月新增</div>
        </div>
        <div class="backdrop-blur-2xl bg-white/70 dark:bg-[#1C1C1E]/70 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300">
          <div class="text-3xl md:text-4xl font-bold text-[#FF9F0A] dark:text-[#FFD60A] mb-2">
            {{ books?.length || 0 }}
          </div>
          <div class="text-sm text-[#86868B] dark:text-[#86868B] font-medium">待读书籍</div>
        </div>
        
        <!-- HA控制卡片 -->
        <div class="backdrop-blur-2xl bg-white/70 dark:bg-[#1C1C1E]/70 rounded-2xl p-4 shadow-sm hover:shadow-lg transition-all duration-300">
          <div class="flex items-center justify-between h-full">
            <h2 class="text-sm font-medium text-[#1D1D1F] dark:text-white">智能家居</h2>
            <button
              class="px-4 py-2 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 text-sm font-medium flex items-center"
              :class="{
                'bg-[#34C759] dark:bg-[#32D74B] text-white': isOn,
                'bg-[#007AFF] dark:bg-[#0A84FF] text-white': !isOn
              }"
              @click="toggleLED"
            >
              <i
class="mdi text-lg mr-1" :class="{
                'mdi-lightbulb-on': isOn,
                'mdi-lightbulb-off': !isOn
              }"/>
              {{ isOn ? '关闭' : '打开' }}LED
            </button>
          </div>
        </div>
      </div>

      <!-- 书墙区域 -->
      <section>
        <div v-if="pending" class="flex justify-center items-center py-20">
          <div class="w-8 h-8 border-3 border-[#007AFF]/20 dark:border-[#0A84FF]/20 border-t-[#007AFF] dark:border-t-[#0A84FF] rounded-full animate-spin"/>
        </div>
        <div
          v-else
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6"
        >
          <div
            v-for="book in filteredBooks"
            :key="book.isbn"
            class="group"
          >
            <div
              class="aspect-[3/4] rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 relative cursor-pointer"
              @click="selectedBook = book"
            >
              <img
                v-if="book.img"
                :src="book.img"
                :alt="book.title"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div
                v-else
                class="w-full h-full bg-gradient-to-br from-[#5856D6] to-[#FF2D55] dark:from-[#5856D6] dark:to-[#FF2D55] flex items-center justify-center p-6"
              >
                <span class="text-white text-base font-medium text-center break-words">
                  {{ book.title }}
                </span>
              </div>
              
              <!-- iOS 风格悬浮信息 -->
              <div
                class="absolute inset-0 backdrop-blur-lg bg-white/30 dark:bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                :class="{'opacity-100': isMobile && isBookInfoVisible}"
                @click="isMobile && toggleBookInfo($event)"
              >
                <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                  <h3 class="text-base font-medium text-white mb-2 line-clamp-2">{{ book.title }}</h3>
                  <p class="text-sm text-white/80 mb-1">{{ book.author }}</p>
                  <p class="text-xs text-white/60">{{ book.publisher }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    
    <!-- iOS 风格扫码弹窗 -->
    <Teleport to="body">
      <div
        v-if="showScanner"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-lg"
      >
        <div class="w-full max-w-2xl backdrop-blur-2xl bg-white/90 dark:bg-[#1C1C1E]/90 rounded-3xl p-6 shadow-xl">
          <div class="flex justify-between items-center mb-6">
            <div class="flex items-center space-x-4">
              <h3 class="text-xl font-medium text-[#1D1D1F] dark:text-white">扫码枪录入</h3>
              <span class="text-sm text-[#86868B] dark:text-[#86868B]">已扫描 {{ scannedCount }} 本</span>
            </div>
            <div class="flex items-center space-x-3">
              <button
                class="px-4 py-2 bg-[#34C759] text-white rounded-full text-sm hover:opacity-90 transition-opacity"
                @click="handleBatchComplete"
              >
                完成
              </button>
              <button
                class="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                @click="showScanner = false"
              >
                <i class="mdi mdi-close text-xl text-[#86868B]"/>
              </button>
            </div>
          </div>
          <BookScanner
            mode="barcode"
            @scan-success="handleScanSuccess"
            @scan-error="handleScanError"
          />
        </div>
      </div>
    </Teleport>

    <!-- 图书详情弹窗 -->
    <Teleport to="body">
      <div
        v-if="selectedBook"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-lg"
        @click="selectedBook = null"
      >
        <div 
          class="w-full max-w-2xl backdrop-blur-2xl bg-white/90 dark:bg-[#1C1C1E]/90 rounded-3xl p-6 shadow-xl"
          @click.stop
        >
          <div class="flex justify-between items-start mb-6">
            <div class="flex items-start space-x-6">
              <div class="w-32 h-44 flex-shrink-0">
                <img
                  v-if="selectedBook.img"
                  :src="selectedBook.img"
                  :alt="selectedBook.title"
                  class="w-full h-full object-cover rounded-xl shadow-lg"
                />
                <div
                  v-else
                  class="w-full h-full bg-gradient-to-br from-[#5856D6] to-[#FF2D55] dark:from-[#5856D6] dark:to-[#FF2D55] rounded-xl shadow-lg flex items-center justify-center p-4"
                >
                  <span class="text-white text-sm font-medium text-center break-words">
                    {{ selectedBook.title }}
                  </span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-xl font-medium text-[#1D1D1F] dark:text-white">
                  {{ selectedBook.title }}
                </h3>
                <p class="mt-2 text-base text-[#86868B] dark:text-[#86868B]">
                  作者：{{ selectedBook.author }}
                </p>
                <p class="mt-1 text-base text-[#86868B] dark:text-[#86868B]">
                  出版社：{{ selectedBook.publisher }}
                </p>
                <p class="mt-1 text-base text-[#86868B] dark:text-[#86868B]">
                  出版日期：{{ selectedBook.pubdate }}
                </p>
                <p class="mt-1 text-base text-[#86868B] dark:text-[#86868B]">
                  ISBN：{{ selectedBook.isbn }}
                </p>
              </div>
            </div>
            <button
              class="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              @click="selectedBook = null"
            >
              <i class="mdi mdi-close text-xl text-[#86868B]"/>
            </button>
          </div>
          <div v-if="selectedBook.summary" class="mt-6">
            <h4 class="text-base font-medium text-[#1D1D1F] dark:text-white mb-2">内容简介</h4>
            <p class="text-base text-[#86868B] dark:text-[#86868B] leading-relaxed whitespace-pre-wrap">
              {{ selectedBook.summary }}
            </p>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- iOS 风格摄像头扫描弹窗 -->
    <Teleport to="body">
      <div
        v-if="showCameraScanner"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-lg"
      >
        <div class="w-full max-w-2xl backdrop-blur-2xl bg-white/90 dark:bg-[#1C1C1E]/90 rounded-3xl p-6 shadow-xl">
          <div class="flex justify-between items-center mb-6">
            <div class="flex items-center space-x-4">
              <h3 class="text-xl font-medium text-[#1D1D1F] dark:text-white">摄像头扫描</h3>
              <span class="text-sm text-[#86868B] dark:text-[#86868B]">已扫描 {{ scannedCount }} 本</span>
            </div>
            <div class="flex items-center space-x-3">
              <button
                class="px-4 py-2 bg-[#34C759] text-white rounded-full text-sm hover:opacity-90 transition-opacity"
                @click="handleBatchComplete"
              >
                完成
              </button>
              <button
                class="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                @click="showCameraScanner = false"
              >
                <i class="mdi mdi-close text-xl text-[#86868B]"/>
              </button>
            </div>
          </div>
          <BookScanner
            mode="camera"
            @scan-success="handleScanSuccess"
            @scan-error="handleScanError"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import '@mdi/font/css/materialdesignicons.css'
import BookScanner from '~/components/BookScanner.vue'

interface Book {
  title: string;
  img: string;
  author: string;
  isbn: string;
  publisher: string;
  pubdate: string;
  summary: string;
}

interface LEDResponse {
  success: boolean;
  isOn: boolean;
}

// 搜索相关
const searchQuery = ref('');

// 过滤后的书籍列表
const filteredBooks = computed(() => {
  if (!books.value) return [];
  if (!searchQuery.value) return books.value;
  
  const query = searchQuery.value.toLowerCase().trim();
  return books.value.filter((book: Book) => {
    return book.title.toLowerCase().includes(query) ||
           book.author.toLowerCase().includes(query) ||
           book.publisher.toLowerCase().includes(query);
  });
});

// 获取书籍数据
const { data: books, pending } = useAsyncData<Book[]>('books', () => {
  return $fetch('/api/books');
});

// 计算本月新增书籍数量
const getNewBooksCount = () => {
  if (!books.value) return 0;
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  
  return books.value.filter((book: Book) => {
    const pubDate = new Date(book.pubdate);
    return pubDate.getMonth() === thisMonth && pubDate.getFullYear() === thisYear;
  }).length;
};

// 颜色模式
const colorMode = useColorMode();

// 当前是否为深色模式
const isDarkMode = computed(() => (colorMode.value as string) === 'dark');

// 切换颜色模式
const toggleColorMode = () => {
  colorMode.preference = isDarkMode.value ? 'light' : 'dark';
};

// 扫码相关
const showScanner = ref(false)
const showCameraScanner = ref(false)
const scannedCount = ref(0)

// 处理扫码成功
const handleScanSuccess = async (_book: Book) => {
  // 更新扫描计数
  scannedCount.value++
  // 重新获取书籍列表
  books.value = await $fetch('/api/books')
}

// 处理扫码错误
const handleScanError = (error: string) => {
  alert(error)
}

// 处理批量完成
const handleBatchComplete = () => {
  showScanner.value = false
  showCameraScanner.value = false
  scannedCount.value = 0
}

// 检测是否为移动设备
const isMobile = ref(false)
const isBookInfoVisible = ref(false)

// 在组件挂载时检测设备类型
onMounted(() => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  // 监听窗口大小变化
  window.addEventListener('resize', checkMobile)
  getLEDStatus()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

// 检查是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// 移动端点击切换书籍信息显示
const toggleBookInfo = (event: MouseEvent) => {
  const element = event.currentTarget as HTMLElement
  const bookInfo = element.querySelector('.book-info') as HTMLElement
  
  // 移除其他书籍的 active 类
  document.querySelectorAll('.book-info.active').forEach(el => {
    if (el !== bookInfo) {
      el.classList.remove('active')
    }
  })
  
  // 切换当前书籍的 active 类
  bookInfo.classList.toggle('active')
}

// 选中的书籍（用于显示详情）
const selectedBook = ref<Book | null>(null)

// HA控制相关
const isOn = ref(false)

// 获取LED状态
async function getLEDStatus() {
  try {
    const response = await $fetch<LEDResponse>('/api/led/status')
    if (response.success) {
      isOn.value = response.isOn
    }
  } catch (error) {
    console.error('获取状态失败:', error)
  }
}

// 控制LED开关
async function toggleLED() {
  try {
    const { data } = await useFetch<LEDResponse>('/api/led/toggle', {
      method: 'POST',
      body: {
        action: isOn.value ? 'turn_off' : 'turn_on'
      }
    })
    
    if (data.value?.success) {
      isOn.value = !isOn.value
    }
  } catch (error) {
    console.error('控制失败:', error)
    alert('控制失败，请检查配置')
  }
}
</script>

<style scoped>
@keyframes blob {
  0% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0, 0) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
