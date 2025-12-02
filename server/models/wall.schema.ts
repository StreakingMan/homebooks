import { defineMongooseModel } from '#nuxt/mongoose';

export const WallSchema = defineMongooseModel({
  name: 'Wall',
  schema: {
    name: { type: String, default: 'Default Wall' },
    rows: { type: Number, default: 7 },
    cols: { type: Number, default: 8 },
    isActive: { type: Boolean, default: true },
  },
});
