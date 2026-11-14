import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ShopSettingsSchema = new Schema({
  _id: { type: String, default: "shop" },
  shopName: { type: String, default: "Watch Shop" },
  address: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  logoUrl: { type: String },
  logoCloudinaryId: { type: String },
  receiptThankYouNote: {
    type: String,
    default: "Thank you for your purchase. We appreciate your business.",
  },
  repairTermsAndConditions: {
    type: String,
    default:
      "Repairs are undertaken at customer's risk where applicable. Collection within 30 days of ready notice.",
  },
  defaultLowStockThreshold: { type: Number, default: 10 },
  receiptPaperWidth: { type: String, enum: ["58mm", "80mm"], default: "80mm" },
  taxEnabled: { type: Boolean, default: false },
});

export type IShopSettings = InferSchemaType<typeof ShopSettingsSchema>;

export const ShopSettings: Model<IShopSettings> =
  mongoose.models.ShopSettings ??
  mongoose.model<IShopSettings>("ShopSettings", ShopSettingsSchema);
