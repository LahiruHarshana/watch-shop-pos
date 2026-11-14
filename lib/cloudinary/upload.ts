import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadImageBuffer(
  buffer: Buffer,
  mime: string,
  folder = "watch-shop-pos",
) {
  if (!ALLOWED.includes(mime)) {
    throw new Error("Invalid file type");
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("File too large");
  }
  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err || !result) reject(err ?? new Error("Upload failed"));
        else resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}
