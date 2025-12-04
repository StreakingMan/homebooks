import { BookSchema } from '#imports';

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
            _id: { $ne: existingBook._id },
            isDeleted: { $ne: true },
          });

          existingBook.position = {
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
