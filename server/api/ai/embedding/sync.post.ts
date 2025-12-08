/**
 * 书籍向量同步接口
 * 批量向量化书籍摘要并存入Chroma向量库
 */
import { BookSchema } from '#imports';
import { addBooksToVectorStore, getStoredBookISBNs, getVectorStoreStats } from '../../../utils/vector-store';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { force = false } = body || {};

  try {
    console.log('📚 开始同步书籍向量...');

    // 获取所有书籍
    const allBooks = await BookSchema.find({
      isDeleted: { $ne: true },
    }).lean();

    console.log(`  找到 ${allBooks.length} 本书籍`);

    // 过滤出有摘要的书籍
    const booksWithSummary = allBooks.filter((book) => book.summary && book.summary.length >= 10);

    console.log(`  其中 ${booksWithSummary.length} 本有摘要`);

    if (booksWithSummary.length === 0) {
      return {
        success: true,
        message: '没有需要向量化的书籍（所有书籍都没有摘要）',
        synced: 0,
        skipped: 0,
        total: 0,
      };
    }

    // 获取已存储的ISBN列表
    let existingISBNs: string[] = [];
    if (!force) {
      existingISBNs = await getStoredBookISBNs();
      console.log(`  向量库中已有 ${existingISBNs.length} 本书`);
    }

    // 过滤出需要同步的书籍
    const booksToSync = force ? booksWithSummary : booksWithSummary.filter((book) => !existingISBNs.includes(book.isbn));

    console.log(`  需要同步 ${booksToSync.length} 本书`);

    if (booksToSync.length === 0) {
      return {
        success: true,
        message: '所有书籍已经向量化，无需同步',
        synced: 0,
        skipped: booksWithSummary.length,
        total: booksWithSummary.length,
      };
    }

    // 批量向量化
    const startTime = Date.now();
    const result = await addBooksToVectorStore(booksToSync);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // 获取最终统计
    const stats = await getVectorStoreStats();

    console.log(`✅ 同步完成！用时 ${duration}秒`);

    return {
      success: true,
      message: `成功向量化 ${result.synced} 本书籍`,
      synced: result.synced,
      skipped: result.skipped,
      total: stats.total,
      duration: `${duration}秒`,
    };
  } catch (error: any) {
    console.error('❌ 向量同步失败:', error);

    throw createError({
      statusCode: 500,
      message: `向量同步失败: ${error.message || '未知错误'}`,
    });
  }
});
