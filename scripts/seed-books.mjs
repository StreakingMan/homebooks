#!/usr/bin/env node
/**
 * 模拟 ISBN 扫码录入书籍（独立运行）
 *
 * 使用方法：
 *   node scripts/seed-books.mjs
 *
 * 确保开发服务器已启动 (pnpm dev)
 * 系统会自动从探数 API 获取书籍信息
 */

const API_BASE = 'http://localhost:4000';

// 50本经典书籍的 ISBN 码，涵盖多个领域
const isbnList = [
  // === 文学小说 (10本) ===
  '9787544253994', // 百年孤独
  '9787020002207', // 红楼梦
  '9787530216780', // 1984
  '9787532725694', // 挪威的森林
  '9787506365437', // 活着
  '9787536692930', // 三体
  '9787020024759', // 围城
  '9787544242516', // 白夜行
  '9787020042494', // 小王子
  '9787208061644', // 追风筝的人

  // === 哲学思想 (8本) ===
  '9787506341271', // 苏菲的世界
  '9787108012180', // 存在与时间
  '9787100017565', // 理想国
  '9787010069029', // 纯粹理性批判
  '9787101052978', // 道德经
  '9787101052367', // 论语
  '9787108017093', // 查拉图斯特拉如是说
  '9787802256132', // 沉思录

  // === 科学技术 (8本) ===
  '9787535732309', // 时间简史
  '9787508629537', // 自私的基因
  '9787100024457', // 物种起源
  '9787121181184', // 编码
  '9787115461476', // 深度学习
  '9787532389810', // 费曼物理学讲义
  '9787030107596', // 从一到无穷大
  '9787111407010', // 算法导论

  // === 历史传记 (8本) ===
  '9787508647357', // 人类简史
  '9787101003048', // 史记
  '9787108009821', // 万历十五年
  '9787532739233', // 枪炮、病菌与钢铁
  '9787508630069', // 史蒂夫·乔布斯传
  '9787535765437', // 艾伦·图灵传
  '9787108041531', // 邓小平时代
  '9787010084220', // 毛泽东传

  // === 经济管理 (8本) ===
  '9787508063683', // 国富论
  '9787010009223', // 资本论
  '9787508633913', // 穷查理宝典
  '9787115559678', // 聪明的投资者
  '9787508633497', // 创新者的窘境
  '9787508651927', // 从0到1
  '9787508684031', // 原则
  '9787508633558', // 思考，快与慢

  // === 心理学 (4本) ===
  '9787115111302', // 心理学与生活
  '9787511346735', // 乌合之众
  '9787544258401', // 梦的解析
  '9787115138804', // 社会心理学

  // === 艺术设计 (4本) ===
  '9787544707411', // 艺术的故事
  '9787508648330', // 设计心理学
  '9787115335036', // 写给大家看的设计书
  '9787508625638', // 配色设计原理
];

async function getWallConfig() {
  const res = await fetch(`${API_BASE}/api/wall/config`);
  const data = await res.json();
  return data.config;
}

// 通过 ISBN 获取书籍信息（模拟扫码录入）
async function fetchBookByISBN(isbn) {
  const res = await fetch(`${API_BASE}/api/books/${isbn}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// 更新书籍位置
async function updateBookPosition(book, position) {
  const res = await fetch(`${API_BASE}/api/books/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ book, position }),
  });
  return res.json();
}

async function main() {
  console.log('🚀 开始模拟 ISBN 扫码录入...\n');

  // 获取书墙配置
  let config;
  try {
    config = await getWallConfig();
  } catch (e) {
    console.error('❌ 无法连接到服务器，请确保 pnpm dev 已运行');
    process.exit(1);
  }

  if (!config) {
    console.error('❌ 未找到书墙配置，请先创建书墙');
    process.exit(1);
  }

  const { rows, cols } = config;
  console.log(`📚 书墙配置: ${rows}行 x ${cols}列\n`);

  let isbnIndex = 0;
  let successCount = 0;
  let failCount = 0;

  // 按行列顺序分配书籍
  for (let row = 0; row < rows && isbnIndex < isbnList.length; row++) {
    for (let col = 0; col < cols && isbnIndex < isbnList.length; col++) {
      const isbn = isbnList[isbnIndex];
      try {
        // Step 1: 通过 ISBN 获取书籍信息（模拟扫码）
        console.log(`📖 [${row},${col}] 扫码: ${isbn}`);
        const book = await fetchBookByISBN(isbn);

        // Step 2: 设置书籍位置
        await updateBookPosition(book, { row, col });
        console.log(`   ✅ ${book.title} - ${book.author || '未知作者'}`);
        successCount++;
      } catch (error) {
        console.log(`   ❌ 失败: ${error.message}`);
        failCount++;
      }

      isbnIndex++;
      // 延迟避免请求过快（探数API有频率限制）
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\n🎉 完成！成功 ${successCount} 本，失败 ${failCount} 本`);
}

main().catch(console.error);
