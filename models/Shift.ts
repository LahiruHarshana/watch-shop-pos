import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ShiftSchema = new Schema(
  {
    openedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    openedAt: { type: Date, default: Date.now },
    openingFloatCents: { type: Number, required: true, min: 0 },
    closedBy: { type: Schema.Types.ObjectId, ref: "User" },
    closedAt: { type: Date },
    expectedCashCents: { type: Number },
    countedCashCents: { type: Number },
    varianceCents: { type: Number },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    notes: { type: String },
  },
  { timestamps: false },
);

ShiftSchema.index({ status: 1 });

export type IShift = InferSchemaType<typeof ShiftSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Shift: Model<IShift> =
  mongoose.models.Shift ?? mongoose.model<IShift>("Shift", ShiftSchema);
