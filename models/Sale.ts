import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const LineDiscountSchema = new Schema(
  {
    type: { type: String, enum: ["flat", "percent"], required: true },
    value: { type: Number, required: true },
    amountCents: { type: Number, required: true },
  },
  { _id: false },
);

const LineItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceCents: { type: Number, required: true },
    lineDiscount: LineDiscountSchema,
    lineTotalCents: { type: Number, required: true },
  },
  { _id: false },
);

const PaymentSchema = new Schema(
  {
    method: {
      type: String,
      enum: ["cash", "card", "bank_transfer"],
      required: true,
    },
    amountCents: { type: Number, required: true },
    tenderedCents: { type: Number },
    changeCents: { type: Number },
  },
  { _id: false },
);

const SaleSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    status: { type: String, enum: ["completed", "voided"], default: "completed" },
    voidReason: { type: String },
    voidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    voidedAt: { type: Date },
    lineItems: { type: [LineItemSchema], required: true },
    cartDiscount: LineDiscountSchema,
    subtotalCents: { type: Number, required: true },
    discountTotalCents: { type: Number, default: 0 },
    totalCents: { type: Number, required: true },
    payments: { type: [PaymentSchema], required: true },
    soldBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    discountAppliedBy: { type: Schema.Types.ObjectId, ref: "User" },
    shiftId: { type: Schema.Types.ObjectId, ref: "Shift" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

SaleSchema.index({ createdAt: -1 });

export type ISale = InferSchemaType<typeof SaleSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Sale: Model<ISale> =
  mongoose.models.Sale ?? mongoose.model<ISale>("Sale", SaleSchema);
