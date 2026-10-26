import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const StockAdjustmentSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    delta: { type: Number, required: true },
    reason: {
      type: String,
      enum: ["purchase", "damage", "correction", "other"],
      required: true,
    },
    note: { type: String },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type IStockAdjustment = InferSchemaType<typeof StockAdjustmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const StockAdjustment: Model<IStockAdjustment> =
  mongoose.models.StockAdjustment ??
  mongoose.model<IStockAdjustment>("StockAdjustment", StockAdjustmentSchema);
