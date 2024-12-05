import { BookSchema } from '#imports';

export default defineEventHandler(async (event) => {
  const isbn = getRouterParam(event, 'isbn');
  return BookSchema.findOneAndUpdate({ isbn }, { isDeleted: true }, { new: true });
});
