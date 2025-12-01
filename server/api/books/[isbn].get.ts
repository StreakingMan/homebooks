import { BookSchema } from '#imports';
import { $fetch } from 'ofetch';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const isbn = getRouterParam(event, 'isbn');
  const findBook = await BookSchema.findOneAndUpdate({ isbn }, { isDeleted: false }, { new: true });
  if (findBook) {
    return findBook;
  } else {
    const { code, data, msg } = await $fetch('https://api.tanshuapi.com/api/isbn/v1/index', {
      method: 'get',
      params: {
        key: config.tanshuapiKey,
        isbn,
      },
    });
    console.log('/api/books/[isbn].get', code, data, msg);
    if (code !== 1) {
      throw createError({
        statusCode: 404,
        message: msg,
      });
    } else {
      const book = new BookSchema(data);
      await book.save();
      return book;
    }
  }
});
