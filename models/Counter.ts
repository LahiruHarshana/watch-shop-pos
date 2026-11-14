import mongoose, { Schema, type Model } from "mongoose";

const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
  dateKey: { type: String },
});

export const Counter: Model<{ _id: string; seq: number; dateKey?: string }> =
  mongoose.models.Counter ?? mongoose.model("Counter", CounterSchema);

export async function nextSequence(key: string, dateKey?: string): Promise<number> {
  const doc = await Counter.findByIdAndUpdate(
    key,
    {
      $inc: { seq: 1 },
      $set: { dateKey },
    },
    { new: true, upsert: true },
  );
  return doc!.seq;
}
