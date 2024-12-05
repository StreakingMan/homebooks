import { BookSchema } from '#imports';
import { $fetch } from 'ofetch';

export default defineEventHandler(async (event) => {
  const isbn = getRouterParam(event, 'isbn');
  const findBook = await BookSchema.findOneAndUpdate({ isbn }, { isDeleted: false }, { new: true });
  if (findBook) {
    return findBook;
  } else {
    const { code, data, msg } = await $fetch('https://api.tanshuapi.com/api/isbn/v1/index', {
      method: 'get',
      params: {
        key: process.env.TANSHUAPI_KEY,
        isbn,
      },
    });
    if (code !== 1) {
      throw createError({
        statusCode: 404,
        statusMessage: msg,
      });
    } else {
      const book = new BookSchema(data);
      await book.save();
      return book;
    }
  }
});
