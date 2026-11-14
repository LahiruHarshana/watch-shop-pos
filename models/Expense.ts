import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ExpenseSchema = new Schema(
  {
    amountCents: { type: Number, required: true, min: 1 },
    categoryId: { type: Schema.Types.ObjectId, ref: "ExpenseCategory", required: true },
    description: { type: String, required: true, trim: true },
    spentOn: { type: String, required: true },
    note: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

ExpenseSchema.index({ spentOn: -1, categoryId: 1 });

export type IExpense = InferSchemaType<typeof ExpenseSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Expense: Model<IExpense> =
  mongoose.models.Expense ?? mongoose.model<IExpense>("Expense", ExpenseSchema);
