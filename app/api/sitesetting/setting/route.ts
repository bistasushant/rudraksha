import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { hasAuth } from "@/lib/hasAuth";
import Settings from "@/models/Settings";
import {
  ApiResponse,
  ISettings,
  SettingsResponseData,
  PlainSettings,
} from "@/types";
import { uploadImage } from "@/lib/imageUpload";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET() {
  await connectDB();

  try {
    const settings = (await Settings.findOne().lean()) as PlainSettings | null;
    const responseData: ApiResponse<SettingsResponseData | null> = {
      error: false,
      message: settings
        ? "Settings retrieved successfully"
        : "No settings found",
      data: settings
        ? {
            googleAnalytics: settings.googleAnalytics,
            logo: settings.logo,
            currency: settings.currency,
            title: settings.title,
          }
        : null,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Get Settings Error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
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

interface SettingsUpdateData {
  logo?: {
    url: string;
    createdAt: Date;
  };
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { user, response } = await hasAuth(req);
  if (!user || response) {
    console.error("Authentication failed:", {
      user: user ? "Present" : "Missing",
      response: response ? response.status : "No response",
    });
    return (
      response ||
      NextResponse.json(
        { error: true, message: "Unauthorized" } as ApiResponse,
        { status: 401, headers: corsHeaders }
      )
    );
  }

  if (user.role !== "admin") {
    console.error("Forbidden: User is not admin:", { userRole: user.role });
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: Only administrators can manage settings",
      } as ApiResponse,
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const formData = await req.formData();
    const updateData: SettingsUpdateData = {};

    // Handle logo file upload
    const logoFile = formData.get("logo") as File | null;
    if (!logoFile) {
      console.error("No logo file provided in formData");
      return NextResponse.json(
        {
          error: true,
          message: "No logo file provided",
        } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    const validTypes = [
      "image/png",
      "image/jpeg",
      "image/svg+xml",
      "image/avif",
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!validTypes.includes(logoFile.type)) {
      console.error("Invalid file type:", { fileType: logoFile.type });
      return NextResponse.json(
        {
          error: true,
          message: "Invalid file type. Allowed: PNG, JPEG, SVG, AVIF",
        } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }
    if (logoFile.size > maxSize) {
      console.error("File too large:", { fileSize: logoFile.size });
      return NextResponse.json(
        {
          error: true,
          message: "File too large. Max size: 5MB",
        } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    // Check for existing settings to get the current logo's public_id
    const existingSettings =
      (await Settings.findOne().lean()) as PlainSettings | null;
    let existingPublicId: string | undefined;
    if (existingSettings?.logo?.url) {
      const urlParts = existingSettings.logo.url.split("/");
      const fileName = urlParts[urlParts.length - 1].split(".")[0];
      existingPublicId = `logos/${fileName}`;
      console.log("Existing logo found:", {
        publicId: existingPublicId,
        url: existingSettings.logo.url,
      });
    } else {
      console.log("No existing logo found");
    }

    // Upload new logo to Cloudinary
    console.log("Uploading logo to Cloudinary:", {
      name: logoFile.name,
      type: logoFile.type,
      size: logoFile.size,
    });
    const uploadResult = await uploadImage(logoFile, existingPublicId);
    updateData.logo = {
      url: uploadResult.url,
      createdAt: new Date(),
    };

    // Update or create settings in MongoDB
    let savedSettings;
    if (existingSettings) {
      console.log("Updating existing settings with:", updateData);
      savedSettings = await Settings.findOneAndUpdate(
        {},
        { $set: updateData },
        { new: true }
      );
    } else {
      console.log("Creating new settings with:", updateData);
      const newSettings = new Settings(updateData);
      savedSettings = await newSettings.save();
    }

    const responseData: ApiResponse<ISettings> = {
      error: false,
      message: existingSettings
        ? "Logo updated successfully"
        : "Logo added successfully",
      data: savedSettings.toObject(),
    };

    console.log("Logo operation successful:", {
      message: responseData.message,
      logoUrl: savedSettings.logo?.url,
    });

    return NextResponse.json(responseData, {
      status: existingSettings ? 200 : 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Manage Settings Error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      context: "POST /api/sitesetting/setting",
    });
    return NextResponse.json(
      {
        error: true,
        message:
          error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500, headers: corsHeaders }
    );
  }
}
