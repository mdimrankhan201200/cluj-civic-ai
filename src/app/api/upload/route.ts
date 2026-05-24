import { auth } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { analyzeInfrastructureImage } from "@/lib/ai-analysis";
import { put } from "@vercel/blob";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function isCloudinaryConfigured() {
  const name = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const key  = process.env.CLOUDINARY_API_KEY ?? "";
  return name.length > 0 && !name.includes("your-") && key.length > 0 && !key.includes("your-");
}

function isBlobConfigured() {
  const token = process.env.BLOB_READ_WRITE_TOKEN ?? "";
  return token.length > 0 && token.startsWith("vercel_blob_rw_");
}

async function uploadToCloudinary(buffer: Buffer): Promise<{ imageUrl: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: "cluj-civic/reports" }, (error, result) => {
        if (error || !result) reject(error ?? new Error("Cloudinary upload failed"));
        else resolve({ imageUrl: result.secure_url, publicId: result.public_id });
      })
      .end(buffer);
  });
}

async function uploadToBlob(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const filename = `reports/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const blob = await put(filename, buffer, { access: "public", contentType: mimeType });
  return blob.url;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return Response.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ error: "Invalid file type. Use JPEG, PNG, or WebP." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let imageUrl: string;
    let publicId: string | undefined;

    if (isCloudinaryConfigured()) {
      const result = await uploadToCloudinary(buffer);
      imageUrl = result.imageUrl;
      publicId = result.publicId;
    } else if (isBlobConfigured()) {
      imageUrl = await uploadToBlob(buffer, file.type);
    } else {
      // No storage configured — run AI analysis on the buffer and return a
      // placeholder URL so the form can still proceed in demo/dev mode.
      console.warn("No image storage configured (set CLOUDINARY_* or BLOB_READ_WRITE_TOKEN). Using placeholder.");
      imageUrl = `https://placehold.co/800x600/e2e8f0/64748b?text=Image+Uploaded`;
    }

    const aiResult = await analyzeInfrastructureImage(imageUrl, buffer, file.type);

    return Response.json({ imageUrl, publicId, aiResult });
  } catch (err) {
    console.error("Upload error:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
