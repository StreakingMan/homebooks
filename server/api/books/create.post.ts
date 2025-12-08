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
    // 计算位置的 order
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

    // 如果有 ISBN，使用原子操作防止并发重复
    if (book.isbn) {
      const result = await BookSchema.findOneAndUpdate(
        {
          isbn: book.isbn,
          isDeleted: { $ne: true },
        },
        {
          // 只在新建时设置的字段
          $setOnInsert: {
            title: book.title,
            isbn: book.isbn,
            author: book.author,
            publisher: book.publisher,
            pubdate: book.pubdate,
            img: book.img,
            summary: book.summary,
            price: book.price,
            keyword: book.keyword,
            status: 'available',
          },
          // 每次都更新位置（如果有）
          ...(newPosition && { $set: { position: newPosition } }),
        },
        {
          upsert: true, // 不存在则创建
          new: true, // 返回更新后的文档
          setDefaultsOnInsert: true,
        },
      );

      // 判断是新建还是更新（通过检查 position 变化或其他方式）
      // MongoDB 6.0+ 可以用 result.lastErrorObject.upserted 判断
      // 这里简单判断：如果传了位置且位置更新了，就是更新操作
      const isNewBook = !result.updatedAt || result.createdAt?.getTime() === result.updatedAt?.getTime();

      // 🔥 新建时自动向量化
      if (isNewBook && result.summary) {
        addBookToVectorStore({
          isbn: result.isbn,
          title: result.title,
          author: result.author,
          summary: result.summary,
        }).catch((_error) => {
          console.error('自动向量化失败:', _error);
        });
      }

      return {
        success: true,
        book: result,
        updated: !isNewBook,
      };
    }

    // 没有 ISBN 的书籍直接创建（无法防重）
    const newBook = await BookSchema.create({
      ...book,
      position: newPosition,
      status: 'available',
    });

    // 🔥 自动向量化
    if (newBook.summary) {
      addBookToVectorStore({
        isbn: newBook.isbn,
        title: newBook.title,
        author: newBook.author,
        summary: newBook.summary,
      }).catch((_error) => {
        console.error('自动向量化失败:', _error);
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
