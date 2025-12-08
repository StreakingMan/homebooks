import { BookSchema } from '#imports';
import { deleteBookFromVectorStore } from '../../utils/vector-store';

export default defineEventHandler(async (event) => {
  const isbn = getRouterParam(event, 'isbn');

  if (!isbn) {
    throw createError({
      statusCode: 400,
      message: 'ISBN is required',
    });
  }

  const result = await BookSchema.findOneAndUpdate({ isbn }, { isDeleted: true }, { new: true });

  // 🔥 从向量库删除（异步执行）
  if (result) {
    deleteBookFromVectorStore(isbn).catch((error) => {
      console.error('删除向量失败:', error);
      // 不影响主流程
    });
  }

  return result;
});
