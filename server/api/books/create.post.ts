import { BookSchema } from '#imports';
import { addBookToVectorStore } from '../../utils/vector-store';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { book, position } = body;

  if (!book || !book.title) {
    throw createError({
      statusCode: 400,
      message: 'Invalid book data',
    });
  }

  try {
    // 检查 ISBN 是否已存在
    if (book.isbn) {
      const existingBook = await BookSchema.findOne({
        isbn: book.isbn,
        isDeleted: { $ne: true },
      });

      if (existingBook) {
        // 已存在，更新位置信息
        if (position) {
          const existingInCell = await BookSchema.countDocuments({
            'position.row': position.row,
            'position.col': position.col,
            isDeleted: { $ne: true },
          });

          existingBook.position = {
            ...existingBook.position,
            ...position,
            order: existingInCell,
          };
        }
        await existingBook.save();

        return {
          success: true,
          book: existingBook,
          updated: true, // 标记是更新而非新建
        };
      }
    }

    // 不存在，创建新记录
    let newPosition = null;
    if (position) {
      const existingInCell = await BookSchema.countDocuments({
        'position.row': position.row,
        'position.col': position.col,
        isDeleted: { $ne: true },
      });
      newPosition = {
        ...position,
        order: existingInCell,
      };
    }

    const newBook = await BookSchema.create({
      ...book,
      position: newPosition,
      status: 'available',
    });

    // 🔥 自动向量化（异步执行，不影响主流程）
    if (newBook.summary) {
      addBookToVectorStore({
        isbn: newBook.isbn,
        title: newBook.title,
        author: newBook.author,
        summary: newBook.summary,
      }).catch((_error) => {
        console.error('自动向量化失败:', _error);
        // 不抛出错误，不影响主流程
      });
    }

    return {
      success: true,
      book: newBook,
    };
  } catch (error) {
    console.error('Failed to add book:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to save book',
    });
  }
});
