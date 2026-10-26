import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const StatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ["pending", "in_progress", "ready", "delivered"],
      required: true,
    },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    changedAt: { type: Date, default: Date.now },
    note: { type: String },
  },
  { _id: false },
);

const RepairTicketSchema = new Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    watchBrand: { type: String, required: true, trim: true },
    watchModel: { type: String, required: true, trim: true },
    issueDescription: { type: String, required: true },
    estimatedCostCents: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "in_progress", "ready", "delivered"],
      default: "pending",
    },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    payment: {
      method: { type: String, enum: ["cash", "card", "bank_transfer"] },
      amountCents: { type: Number },
      paidAt: { type: Date },
      receivedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    intakePhotoUrl: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

RepairTicketSchema.index({ status: 1, updatedAt: -1 });

export type IRepairTicket = InferSchemaType<typeof RepairTicketSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type RepairStatus = "pending" | "in_progress" | "ready" | "delivered";

export const RepairTicket: Model<IRepairTicket> =
  mongoose.models.RepairTicket ??
  mongoose.model<IRepairTicket>("RepairTicket", RepairTicketSchema);
