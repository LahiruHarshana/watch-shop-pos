import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ExpenseCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    keywords: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type IExpenseCategory = InferSchemaType<typeof ExpenseCategorySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ExpenseCategory: Model<IExpenseCategory> =
  mongoose.models.ExpenseCategory ??
  mongoose.model<IExpenseCategory>("ExpenseCategory", ExpenseCategorySchema);
