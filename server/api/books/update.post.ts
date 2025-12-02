import { BookSchema } from '#imports';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { id, position } = body;

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'Book ID is required',
    });
  }

  try {
    const book = await BookSchema.findByIdAndUpdate(
      id,
      {
        $set: {
          position: position,
          // If position is set, status is available (or whatever logic).
          // If position is removed, maybe unplaced?
        },
      },
      { new: true },
    );

    if (!book) {
      throw createError({
        statusCode: 404,
        message: 'Book not found',
      });
    }

    return {
      success: true,
      book,
    };
  } catch (error) {
    console.error('Failed to update book:', error);
    throw createError({
      statusCode: 500,
      message: 'Failed to update book',
    });
  }
});
