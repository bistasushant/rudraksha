import { hasAuth } from "@/lib/hasAuth";
import { NextRequest, NextResponse } from "next/server";
import Admin from "@/models/Admin";
import { ApiResponse } from "@/types";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "public/uploads/profile-images");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const { admin, response } = await hasAuth(req);
    if (response) return response;

    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: true, message: "No image file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid file type. Only JPEG, PNG, and GIF are allowed",
        },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${admin._id}-${timestamp}-${file.name}`;
    const filePath = path.join(uploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filePath, buffer);

    // Remove old image if exists
    const existingAdmin = await Admin.findById(admin._id);
    if (existingAdmin?.image) {
      const oldImagePath = path.join(
        process.cwd(),
        "public",
        existingAdmin.image
      );
      try {
        fs.unlinkSync(oldImagePath);
      } catch (error) {
        console.warn("Could not delete old image:", error);
      }
    }

    // Update admin profile with new image path
    const imageUrl = `/uploads/profile-images/${filename}`;
    await Admin.updateOne({ _id: admin._id }, { image: imageUrl });

    return NextResponse.json({
      error: false,
      message: "Profile image uploaded successfully",
      imageUrl,
    } as ApiResponse);
  } catch (error) {
    console.error("Profile image upload error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" },
      { status: 500 }
    );
  }
}
