import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    priceCents: { type: Number, required: true, min: 0 },
    costCents: { type: Number, min: 0 },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 10 },
    attributes: {
      batterySize: { type: String },
      brand: { type: String },
    },
    imageUrl: { type: String },
    imageCloudinaryId: { type: String },
    isActive: { type: Boolean, default: true },
    trackInventory: { type: Boolean, default: true },
  },
  { timestamps: true },
);

ProductSchema.index({ name: "text", sku: "text" });

export type IProduct = InferSchemaType<typeof ProductSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Product: Model<IProduct> =
  mongoose.models.Product ?? mongoose.model<IProduct>("Product", ProductSchema);
