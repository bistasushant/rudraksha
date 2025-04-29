import fs from "fs/promises";
import path from "path";

export interface UploadResult {
  url: string;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${file.name}`;
  const filePath = path.join(uploadDir, fileName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  return {
    url: `/uploads/${fileName}`,
  };
}
