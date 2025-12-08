/**
 * 向量库统计信息接口
 * 获取向量库的统计数据
 */
import { BookSchema } from '#imports';
import { getVectorStoreStats } from '../../../utils/vector-store';

export default defineEventHandler(async () => {
  try {
    // 获取向量库统计
    const vectorStats = await getVectorStoreStats();

    // 获取书籍总数
    const totalBooks = await BookSchema.countDocuments({
      isDeleted: { $ne: true },
    });

    // 获取有摘要的书籍数
    const booksWithSummary = await BookSchema.countDocuments({
      isDeleted: { $ne: true },
      summary: { $exists: true, $ne: '' },
    });

    return {
      success: true,
      stats: {
        total_books: totalBooks,
        books_with_summary: booksWithSummary,
        vectorized_books: vectorStats.total,
        coverage: totalBooks > 0 ? ((vectorStats.total / totalBooks) * 100).toFixed(1) + '%' : '0%',
        collection_name: vectorStats.collection_name,
      },
    };
  } catch (error: any) {
    console.error('获取向量库统计失败:', error);

    throw createError({
      statusCode: 500,
      message: `获取统计信息失败: ${error.message || '未知错误'}`,
    });
  }
});
