import { hasAuth } from "@/lib/hasAuth";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/types";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import path from "path";
import fs from "fs/promises";

const uploadDir = path.join(process.cwd(), "public/uploads/profile-images");
const maxFileSize = 5 * 1024 * 1024; // 5MB

// Ensure upload directory exists
async function ensureUploadDir() {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    console.log("Upload directory ensured:", uploadDir);
  } catch (error) {
    console.error("Failed to create upload directory:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    await ensureUploadDir();

    // Check authentication
    const { user, response } = await hasAuth(req);
    if (response) {
      console.log("Authentication failed:", response);
      return response;
    }

    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      console.log("No image file provided");
      return NextResponse.json(
        { error: true, message: "No image file provided" } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      console.log("Invalid file type:", file.type);
      return NextResponse.json(
        {
          error: true,
          message: "Invalid file type. Only JPEG, PNG, and GIF are allowed",
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (file.size > maxFileSize) {
      console.log("File size exceeds limit:", file.size);
      return NextResponse.json(
        {
          error: true,
          message: "File size exceeds 5MB limit",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${user._id}-${timestamp}-${file.name}`;
    const filePath = path.join(uploadDir, filename);

    // Save file
    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));
    console.log("File saved to:", filePath);

    // Remove old image if exists
    const existingUser = await User.findById(user._id);
    if (existingUser?.image && existingUser.image !== "") {
      const oldImagePath = path.join(
        process.cwd(),
        "public",
        existingUser.image
      );
      try {
        await fs.unlink(oldImagePath);
        console.log("Deleted old image:", oldImagePath);
      } catch (error) {
        console.warn("Could not delete old image:", error);
      }
    }

    // Update user with new image path
    const imageUrl = `/public/uploads/profile-images/${filename}`;
    console.log("Updating user with imageUrl:", imageUrl);
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { image: imageUrl },
      { new: true, select: "email name role image contactNumber" }
    );

    if (!updatedUser) {
      console.log("User not found for ID:", user._id);
      return NextResponse.json(
        { error: true, message: "User not found" } as ApiResponse,
        { status: 404 }
      );
    }

    console.log("Updated user:", {
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      image: updatedUser.image,
      contactNumber: updatedUser.contactNumber,
    });

    return NextResponse.json({
      error: false,
      message: "Profile image updated successfully",
      data: {
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        image: updatedUser.image || "",
        contactNumber: updatedUser.contactNumber || "",
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Profile image upload error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
