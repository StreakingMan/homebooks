<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden">
    <!-- 动画背景 -->
    <div class="animated-background absolute inset-0 opacity-10 dark:opacity-20">
      <!-- 添加太阳和月亮 -->
      <div class="celestial-body" :class="[celestialPosition, { animating: isAnimating }]">
        <div class="sun"/>
        <div class="moon"/>
      </div>
      <div class="mountain mountain-1"/>
      <div class="mountain mountain-2"/>
      <div class="mountain mountain-3"/>
      <div class="mountain mountain-4"/>
      <div class="mountain mountain-5"/>
      <div class="clouds">
        <div class="cloud cloud-1"/>
        <div class="cloud cloud-2"/>
        <div class="cloud cloud-3"/>
      </div>
      <div class="stars"/>
      <div class="shooting-stars">
        <div class="shooting-star"/>
        <div class="shooting-star"/>
        <div class="shooting-star"/>
      </div>
    </div>

    <!-- 内容区域添加相对定位和z-index -->
    <div class="relative z-10">
      <!-- 头部区域 -->
      <section class="container mx-auto py-16 text-center relative">
        <!-- 主题切换按钮 -->
        <button
          class="absolute right-4 top-4 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 group"
          :title="isDarkMode ? '切换到浅色模式' : '切换到深色模式'"
          @click="toggleColorMode"
        >
          <!-- 太阳图标 -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 text-amber-500 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <!-- 月亮图标 -->
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="absolute top-2 left-2 h-6 w-6 text-purple-500 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        </button>

        <h1 class="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">
          我的书墙
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          记录阅读足迹，分享知识力量
        </p>
      </section>

      <!-- 统计信息区域 -->
      <section class="container mx-auto py-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div class="text-center">
              <div class="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3">
                {{ books?.length || 0 }}
              </div>
              <div class="text-gray-600 dark:text-gray-400 text-lg">总藏书量</div>
            </div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div class="text-center">
              <div class="text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mb-3">
                {{ getNewBooksCount() }}
              </div>
              <div class="text-gray-600 dark:text-gray-400 text-lg">本月新增</div>
            </div>
          </div>
          <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div class="text-center">
              <div class="text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent mb-3">
                {{ books?.length || 0 }}
              </div>
              <div class="text-gray-600 dark:text-gray-400 text-lg">待读书籍</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 搜索区域 -->
      <section class="container mx-auto py-8">
        <div class="max-w-2xl mx-auto">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索书名、作者或出版社..."
              class="w-full px-6 py-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg focus:ring-2 focus:ring-purple-500 outline-none transition-shadow duration-300 text-gray-700 dark:text-gray-200"
            />
            <div class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- 书墙区域 -->
      <section class="container mx-auto py-12">
        <div v-if="pending" class="flex justify-center items-center py-12">
          <div class="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"/>
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          <div v-for="book in filteredBooks" :key="book.isbn" class="book-card">
            <div
              class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg transition-all duration-300 relative group"
              @mousemove="handleMouseMove"
              @mouseleave="handleMouseLeave"
            >
              <template v-if="book.img">
                <img
                  :src="book.img"
                  class="w-full h-[240px] object-cover"
                  :alt="book.title"
                />
              </template>
              <template v-else>
                <div 
                  class="w-full h-[240px] bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 dark:from-purple-600 dark:via-pink-700 dark:to-red-700 flex items-center justify-center p-4"
                >
                  <span class="text-white text-lg font-bold text-center break-words">{{ book.title }}</span>
                </div>
              </template>
              <!-- 光影效果 -->
              <div class="glare absolute inset-0 pointer-events-none opacity-0 transition-all duration-300"/>
              <!-- 悬浮信息 -->
              <div class="book-info absolute inset-0 text-white opacity-0 group-hover:opacity-100 transition-all duration-500">
                <div class="absolute inset-0 bg-gradient-to-b from-transparent via-black/70 to-black/90 backdrop-blur-sm"/>
                <div class="relative h-full p-6 flex flex-col justify-end">
                  <h3 class="text-xl font-bold mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{{ book.title }}</h3>
                  <div class="space-y-2 text-sm">
                    <p class="flex items-center text-gray-200">
                      <span class="w-12 text-gray-400">作者</span>
                      <span class="ml-2">{{ book.author }}</span>
                    </p>
                    <p class="flex items-center text-gray-200">
                      <span class="w-12 text-gray-400">出版</span>
                      <span class="ml-2">{{ book.publisher }}</span>
                    </p>
                    <p class="mt-3 text-sm text-gray-300 line-clamp-3 leading-relaxed">{{ book.summary }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Book {
  title: string;
  img: string;
  author: string;
  isbn: string;
  publisher: string;
  pubdate: string;
  summary: string;
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

// 鼠标跟随效果
const handleMouseMove = (event: MouseEvent) => {
  const element = event.currentTarget as HTMLElement;
  const rect = element.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // 计算鼠标在卡片上的相对位置（-0.5到0.5之间）
  const xRatio = (x / rect.width - 0.5) * 2;
  const yRatio = (y / rect.height - 0.5) * 2;
  
  // 设置倾斜角度（最大10度）
  const maxDegree = 10;
  element.style.transform = `
    translateY(-1rem)
    rotateX(${-yRatio * maxDegree}deg)
    rotateY(${xRatio * maxDegree}deg)
  `;
  
  // 更新光影效果
  const glare = element.querySelector('.glare') as HTMLElement;
  if (glare) {
    glare.style.opacity = '1';
    glare.style.transform = `
      translate(${-xRatio * 50}%, ${-yRatio * 50}%)
      scale(2)
    `;
  }
};

// 重置卡片状态
const handleMouseLeave = (event: MouseEvent) => {
  const element = event.currentTarget as HTMLElement;
  element.style.transform = 'translateZ(0)';
  const glare = element.querySelector('.glare') as HTMLElement;
  if (glare) {
    glare.style.opacity = '0';
    glare.style.transform = 'translate(0, 0) scale(1)';
  }
};

// 颜色模式
const colorMode = useColorMode();

// 当前是否为深色模式
const isDarkMode = computed(() => (colorMode.value as string) === 'dark');

// 动画状态
const isAnimating = ref(false);
const celestialPosition = ref(isDarkMode.value ? 'night' : 'day');

// 切换颜色模式
const toggleColorMode = () => {
  isAnimating.value = true;
  celestialPosition.value = isDarkMode.value ? 'day' : 'night';
  
  // 等待动画完成后再切换主题
  setTimeout(() => {
    colorMode.preference = isDarkMode.value ? 'light' : 'dark';
    setTimeout(() => {
      isAnimating.value = false;
    }, 1500);
  }, 750);
};
</script>

<style scoped>
.book-card {
  perspective: 1500px;
}

.book-card > div {
  transform: translateZ(0);
  transition: transform 0.1s ease-out;
  transform-style: preserve-3d;
  will-change: transform;
}

.book-info {
  backface-visibility: hidden;
  transform: translateY(20px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
}

.book-card:hover .book-info {
  transform: translateY(0);
  opacity: 1;
}

/* 光影效果 */
.glare {
  background: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.3) 0%,
    transparent 50%
  );
  mix-blend-mode: soft-light;
  transform-origin: center;
}

/* 添加底部阴影效果 */
.book-card::after {
  content: '';
  position: absolute;
  inset: 1rem -1rem -1rem 1rem;
  background: radial-gradient(
    circle at center,
    rgba(0, 0, 0, 0.1) 0%,
    transparent 70%
  );
  transform: translateZ(-1px);
  opacity: 0;
  transition: opacity 0.6s;
  pointer-events: none;
  z-index: -1;
}

.book-card:hover::after {
  opacity: 1;
}

/* 动画背景样式 */
.animated-background {
  pointer-events: none;
  overflow: hidden;
}

/* 太阳和月亮样式 */
.celestial-body {
  position: absolute;
  top: 10%;
  right: 15%;
  width: 180px;
  height: 180px;
  transform-style: preserve-3d;
  perspective: 1000px;
}

.sun {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, 
    #fef3c7 0%,
    #fbbf24 30%, 
    #f59e0b 50%,
    rgba(251, 191, 36, 0) 70%
  );
  border-radius: 50%;
  opacity: 1;
  transform: translateY(0) rotateX(0) rotate(0);
  transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation: sun-pulse 4s ease-in-out infinite;
  transform-origin: center -100px;
  will-change: transform, opacity;
}

.moon {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 25% 25%, 
    #ffffff 0%,
    #f3f4f6 30%, 
    #e5e7eb 60%,
    rgba(229, 231, 235, 0) 80%
  );
  border-radius: 50%;
  opacity: 0;
  transform: translateY(100px) rotateX(-90deg) rotate(0);
  transition: all 1.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation: moon-glow 4s ease-in-out infinite;
  transform-origin: center -100px;
  overflow: hidden;
  will-change: transform, opacity;
}

.moon::after {
  content: '';
  position: absolute;
  inset: -20%;
  background: #1f2937;
  border-radius: 50%;
  transform: translateX(25%);
}

.celestial-body.night .sun {
  opacity: 0;
  transform: translateY(-100px) rotateX(90deg) rotate(180deg);
}

.celestial-body.night .moon {
  opacity: 1;
  transform: translateY(0) rotateX(0) rotate(0);
}

.celestial-body.day .sun {
  opacity: 1;
  transform: translateY(0) rotateX(0) rotate(0);
}

.celestial-body.day .moon {
  opacity: 0;
  transform: translateY(100px) rotateX(-90deg) rotate(-180deg);
}

.celestial-body.animating .sun,
.celestial-body.animating .moon {
  transition-duration: 1.5s;
}

@keyframes sun-pulse {
  0%, 100% {
    transform: translateY(0) rotateX(0) scale(1);
    filter: brightness(1) drop-shadow(0 0 30px rgba(251, 191, 36, 0.4));
  }
  50% {
    transform: translateY(0) rotateX(0) scale(1.05);
    filter: brightness(1.2) drop-shadow(0 0 50px rgba(251, 191, 36, 0.6));
  }
}

@keyframes moon-glow {
  0%, 100% {
    filter: brightness(1) drop-shadow(0 0 30px rgba(255, 255, 255, 0.3));
  }
  50% {
    filter: brightness(1.1) drop-shadow(0 0 50px rgba(255, 255, 255, 0.5));
  }
}

.mountain {
  position: absolute;
  bottom: 0;
  border-left: 150px solid transparent;
  border-right: 150px solid transparent;
  transform-origin: bottom;
  animation: mountain-sway 20s ease-in-out infinite;
  filter: blur(2px);
}

.mountain-1 {
  border-bottom: 200px solid #6366f1;
  left: 5%;
  animation-delay: 0s;
}

.mountain-2 {
  border-bottom: 300px solid #8b5cf6;
  left: 25%;
  animation-delay: -5s;
}

.mountain-3 {
  border-bottom: 250px solid #7c3aed;
  left: 45%;
  animation-delay: -10s;
}

.mountain-4 {
  border-bottom: 280px solid #6366f1;
  left: 65%;
  animation-delay: -7s;
}

.mountain-5 {
  border-bottom: 220px solid #8b5cf6;
  left: 85%;
  animation-delay: -3s;
}

/* 云朵效果 */
.clouds {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.cloud {
  position: absolute;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 100px;
  animation: cloud-float linear infinite;
  transform: scale(2);
  transition: background 1s ease;
}

.cloud::before,
.cloud::after {
  content: '';
  position: absolute;
  background: inherit;
  border-radius: 50%;
}

.cloud-1 {
  width: 180px;
  height: 60px;
  top: 20%;
  animation-duration: 45s;
}

.cloud-1::before {
  width: 75px;
  height: 75px;
  top: -30px;
  left: 22px;
}

.cloud-1::after {
  width: 60px;
  height: 60px;
  top: -22px;
  right: 22px;
}

.cloud-2 {
  width: 150px;
  height: 52px;
  top: 45%;
  animation-duration: 35s;
  animation-delay: -20s;
}

.cloud-2::before {
  width: 67px;
  height: 67px;
  top: -27px;
  left: 18px;
}

.cloud-2::after {
  width: 52px;
  height: 52px;
  top: -19px;
  right: 18px;
}

.cloud-3 {
  width: 210px;
  height: 67px;
  top: 70%;
  animation-duration: 50s;
  animation-delay: -30s;
}

.cloud-3::before {
  width: 82px;
  height: 82px;
  top: -33px;
  left: 27px;
}

.cloud-3::after {
  width: 67px;
  height: 67px;
  top: -25px;
  right: 27px;
}

/* 流星效果 */
.shooting-stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.shooting-star {
  position: absolute;
  width: 100px;
  height: 2px;
  background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%);
  animation: shooting-star 4s ease-in-out infinite;
  opacity: 0;
}

.shooting-star:nth-child(1) {
  top: 15%;
  left: -100px;
  animation-delay: 0s;
}

.shooting-star:nth-child(2) {
  top: 35%;
  left: -100px;
  animation-delay: 2s;
}

.shooting-star:nth-child(3) {
  top: 55%;
  left: -100px;
  animation-delay: 3s;
}

/* 星星效果增强 */
.stars {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0,0,0,0)),
                    radial-gradient(2px 2px at 40px 70px, #ffffff, rgba(0,0,0,0)),
                    radial-gradient(2px 2px at 50px 160px, #ffffff, rgba(0,0,0,0)),
                    radial-gradient(2px 2px at 90px 40px, #ffffff, rgba(0,0,0,0)),
                    radial-gradient(2px 2px at 130px 80px, #ffffff, rgba(0,0,0,0)),
                    radial-gradient(1px 1px at 160px 120px, #ffffff, rgba(0,0,0,0)),
                    radial-gradient(1.5px 1.5px at 200px 50px, #ffffff, rgba(0,0,0,0)),
                    radial-gradient(1px 1px at 220px 180px, #ffffff, rgba(0,0,0,0));
  background-repeat: repeat;
  background-size: 250px 250px;
  animation: stars-twinkle 4s ease-in-out infinite;
  opacity: 0.5;
}

/* 动画定义 */
@keyframes mountain-sway {
  0%, 100% {
    transform: rotate(-2deg) translateY(0);
  }
  50% {
    transform: rotate(2deg) translateY(-10px);
  }
}

@keyframes cloud-float {
  from {
    transform: translateX(-150px);
  }
  to {
    transform: translateX(100vw);
  }
}

@keyframes stars-twinkle {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.8;
  }
}

@keyframes shooting-star {
  0% {
    transform: translateX(0) rotate(-45deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  20% {
    transform: translateX(calc(100vw + 100px)) rotate(-45deg);
    opacity: 0;
  }
  100% {
    transform: translateX(calc(100vw + 100px)) rotate(-45deg);
    opacity: 0;
  }
}

/* 深色模式适配 */
:deep(.dark) .mountain-1 {
  border-bottom-color: #4338ca;
}

:deep(.dark) .mountain-2 {
  border-bottom-color: #5b21b6;
}

:deep(.dark) .mountain-3 {
  border-bottom-color: #6d28d9;
}

:deep(.dark) .mountain-4 {
  border-bottom-color: #4338ca;
}

:deep(.dark) .mountain-5 {
  border-bottom-color: #5b21b6;
}

:deep(.dark) .cloud {
  background: rgba(255, 255, 255, 0.05);
}
</style>
