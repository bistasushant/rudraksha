import { hasAuth } from "@/lib/hasAuth";
import { ApiResponse, ILogo } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Logo from "@/models/Logo";
import { uploadImage } from "@/lib/imageUpload";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET() {
  await connectDB();
  try {
    const logo = (await Logo.findOne().lean()) as ILogo | null;
    const responseData: ApiResponse<ILogo | null> = {
      error: false,
      message: logo ? "Logo retrieved successfully" : "No logo found",
      data: logo
        ? {
            url: logo.url,
            createdAt: logo.createdAt,
          }
        : null,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Get Logo Error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { admin, response } = await hasAuth(req);
  if (!admin || response) {
    return (
      response ||
      NextResponse.json(
        { error: true, message: "Unauthorized" } as ApiResponse,
        { status: 401, headers: corsHeaders }
      )
    );
  }

  if (admin.role !== "admin") {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: Only administrators can manage logos",
      } as ApiResponse,
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: true, message: "No file provided" } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file type and size
    const validTypes = ["image/png", "image/jpeg", "image/svg+xml"];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid file type. Allowed: PNG, JPEG, SVG",
        } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: true,
          message: "File too large. Max size: 5MB",
        } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    // Upload image (assuming uploadImage handles local uploads)
    const uploadResult = await uploadImage(file);

    // Check if logo exists
    const existingLogo = await Logo.findOne();

    let savedLogo;
    if (existingLogo) {
      // Update existing logo
      savedLogo = await Logo.findOneAndUpdate(
        {},
        { url: uploadResult.url, updatedAt: new Date() },
        { new: true }
      );
    } else {
      // Create new logo
      const logoData = {
        url: uploadResult.url,
      };
      const logo = new Logo(logoData);
      savedLogo = await logo.save();
    }

    const responseData: ApiResponse<ILogo> = {
      error: false,
      message: existingLogo
        ? "Logo updated successfully"
        : "Logo added successfully",
      data: {
        url: savedLogo.url,
        createdAt: savedLogo.createdAt,
      },
    };

    return NextResponse.json(responseData, {
      status: existingLogo ? 200 : 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Manage Logo Error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500, headers: corsHeaders }
    );
  }
}
