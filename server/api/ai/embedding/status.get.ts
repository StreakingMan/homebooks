/**
 * 向量库状态查询接口
 * 返回向量库的统计信息
 */
import { BookSchema } from '#imports';
import { getVectorStoreStats } from '../../../utils/vector-store';

export default defineEventHandler(async () => {
  try {
    const stats = await getVectorStoreStats();
    const totalBooks = await BookSchema.countDocuments({ isDeleted: { $ne: true } });
    const booksWithSummary = await BookSchema.countDocuments({
      isDeleted: { $ne: true },
      summary: { $exists: true, $ne: '' },
    });

    return {
      success: true,
      vector_store: stats,
      database: {
        total_books: totalBooks,
        books_with_summary: booksWithSummary,
        books_without_summary: totalBooks - booksWithSummary,
      },
      sync_status: {
        in_vector_store: stats.total,
        pending_sync: Math.max(0, booksWithSummary - stats.total),
        sync_rate: booksWithSummary > 0 ? ((stats.total / booksWithSummary) * 100).toFixed(1) + '%' : '0%',
      },
    };
  } catch (error: any) {
    console.error('❌ 获取状态失败:', error);
    throw createError({
      statusCode: 500,
      message: `获取向量库状态失败: ${error.message}`,
    });
  }
});
