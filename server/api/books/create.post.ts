import { BookSchema } from '#imports';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { book, position } = body;

  if (!book || !book.title || !position) {
    throw createError({
      statusCode: 400,
      message: 'Invalid book data or position',
    });
  }

  try {
    // Determine order in the cell
    const existingInCell = await BookSchema.countDocuments({
      'position.row': position.row,
      'position.col': position.col,
      isDeleted: { $ne: true },
    });

    const newBook = await BookSchema.create({
      ...book,
      position: {
        ...position,
        order: existingInCell, // Append to end
      },
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
