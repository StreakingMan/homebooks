import { BookSchema } from '#imports';

export default defineEventHandler(async () => {
  return await BookSchema.find({
    // isDeleted is not true
    isDeleted: { $ne: true },
  });
});
