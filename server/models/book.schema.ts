import { defineMongooseModel } from '#nuxt/mongoose';

export const BookSchema = defineMongooseModel({
  name: 'Book',
  schema: {
    title: String,
    img: String,
    author: String,
    isbn: String,
    isbn10: String,
    publisher: String,
    pubdate: String,
    pubplace: String,
    keyword: String,
    cip: String,
    pages: String,
    price: String,
    binding: String,
    edition: String,
    impression: String,
    language: String,
    format: String,
    class: String,
    summary: String,
    isDeleted: { type: Boolean, required: false, select: false },
  },
});
