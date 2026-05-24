import { auth } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { analyzeInfrastructureImage } from "@/lib/ai-analysis";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function isCloudinaryConfigured() {
  const name = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const key = process.env.CLOUDINARY_API_KEY ?? "";
  return name.length > 0 && !name.includes("your-") && key.length > 0 && !key.includes("your-");
}

async function saveLocally(buffer: Buffer, mimeType: string): Promise<string> {
  const ext = mimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
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
      return Response.json({ error: "Invalid file type" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let imageUrl: string;
    let publicId: string | undefined;

    if (isCloudinaryConfigured()) {
      const result = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ folder: "cluj-civic/reports" }, (error, result) => {
              if (error || !result) reject(error ?? new Error("Upload failed"));
              else resolve({ secure_url: result.secure_url, public_id: result.public_id });
            })
            .end(buffer);
        }
      );
      imageUrl = result.secure_url;
      publicId = result.public_id;
    } else {
      imageUrl = await saveLocally(buffer, file.type);
    }

    const aiResult = await analyzeInfrastructureImage(imageUrl, buffer, file.type);

    return Response.json({ imageUrl, publicId, aiResult });
  } catch (err) {
    console.error("Upload error:", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
