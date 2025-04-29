import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { hasAuth } from "@/lib/hasAuth";
import Settings from "@/models/Settings";
import { ApiResponse, ISettings, SettingsResponseData } from "@/types";
import { uploadImage } from "@/lib/imageUpload";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST, PUT",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET() {
  await connectDB();

  try {
    const settings = (await Settings.findOne().lean()) as unknown as ISettings;
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
    console.error("Get Settings Error:", error);
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

// Define a specific type for the settings update data
interface SettingsUpdateData {
  logo?: {
    url: string;
    createdAt: Date;
  };
  title?: {
    title: string;
    updatedAt: Date;
  };
  currency?: {
    currency: string;
    updatedAt: Date;
  };
  googleAnalytics?: {
    trackingId: string;
    updatedAt: Date;
  };
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { user, response } = await hasAuth(req);
  if (!user || response) {
    return (
      response ||
      NextResponse.json(
        { error: true, message: "Unauthorized" } as ApiResponse,
        { status: 401, headers: corsHeaders }
      )
    );
  }

  if (user.role !== "admin") {
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
    if (logoFile) {
      const validTypes = ["image/png", "image/jpeg", "image/svg+xml"];
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!validTypes.includes(logoFile.type)) {
        return NextResponse.json(
          {
            error: true,
            message: "Invalid file type. Allowed: PNG, JPEG, SVG",
          } as ApiResponse,
          { status: 400, headers: corsHeaders }
        );
      }
      if (logoFile.size > maxSize) {
        return NextResponse.json(
          {
            error: true,
            message: "File too large. Max size: 5MB",
          } as ApiResponse,
          { status: 400, headers: corsHeaders }
        );
      }
      const uploadResult = await uploadImage(logoFile);
      updateData.logo = {
        url: uploadResult.url,
        createdAt: new Date(),
      };
    }

    // Parse JSON fields
    const jsonData = formData.get("data") as string | null;
    if (jsonData) {
      const parsedData = JSON.parse(jsonData);
      if (parsedData.siteTitle) {
        updateData.title = {
          title: parsedData.siteTitle,
          updatedAt: new Date(),
        };
      }
      if (parsedData.currency) {
        const sanitizedCurrency = parsedData.currency.trim().toUpperCase();
        if (!["USD", "NPR"].includes(sanitizedCurrency)) {
          return NextResponse.json(
            {
              error: true,
              message: "Invalid currency. Must be USD or NPR",
            } as ApiResponse,
            { status: 400, headers: corsHeaders }
          );
        }
        updateData.currency = {
          currency: sanitizedCurrency,
          updatedAt: new Date(),
        };
      }
      if (parsedData.googleAnalytics?.trackingId) {
        if (!/^G-[A-Z0-9]{10}$/.test(parsedData.googleAnalytics.trackingId)) {
          return NextResponse.json(
            {
              error: true,
              message: "Invalid Google Analytics tracking ID format",
            } as ApiResponse,
            { status: 400, headers: corsHeaders }
          );
        }
        updateData.googleAnalytics = {
          trackingId: parsedData.googleAnalytics.trackingId,
          updatedAt: new Date(),
        };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "No valid settings data provided",
        } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if settings document exists
    const existingSettings = await Settings.findOne();
    let savedSettings;

    if (existingSettings) {
      // Update existing settings with a simplified approach
      savedSettings = await Settings.findOneAndUpdate(
        {},
        { $set: updateData },
        { new: true }
      );
    } else {
      // Create new settings
      const newSettings = new Settings(updateData);
      savedSettings = await newSettings.save();
    }

    const responseData: ApiResponse<ISettings> = {
      error: false,
      message: existingSettings
        ? "Settings updated successfully"
        : "Settings created successfully",
      data: savedSettings.toObject(),
    };

    return NextResponse.json(responseData, {
      status: existingSettings ? 200 : 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Manage Settings Error:", error);
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

export async function PUT(req: NextRequest) {
  await connectDB();
  const { user, response } = await hasAuth(req);
  if (!user || response) {
    return (
      response ||
      NextResponse.json(
        { error: true, message: "Unauthorized" } as ApiResponse,
        { status: 401, headers: corsHeaders }
      )
    );
  }

  if (user.role !== "admin") {
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
    if (logoFile) {
      const validTypes = ["image/png", "image/jpeg", "image/svg+xml"];
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!validTypes.includes(logoFile.type)) {
        return NextResponse.json(
          {
            error: true,
            message: "Invalid file type. Allowed: PNG, JPEG, SVG",
          } as ApiResponse,
          { status: 400, headers: corsHeaders }
        );
      }
      if (logoFile.size > maxSize) {
        return NextResponse.json(
          {
            error: true,
            message: "File too large. Max size: 5MB",
          } as ApiResponse,
          { status: 400, headers: corsHeaders }
        );
      }
      const uploadResult = await uploadImage(logoFile);
      updateData.logo = {
        url: uploadResult.url,
        createdAt: new Date(),
      };
    }

    // Parse JSON fields
    const jsonData = formData.get("data") as string | null;
    if (jsonData) {
      const parsedData = JSON.parse(jsonData);
      if (parsedData.siteTitle) {
        updateData.title = {
          title: parsedData.siteTitle,
          updatedAt: new Date(),
        };
      }
      if (parsedData.currency) {
        const sanitizedCurrency = parsedData.currency.trim().toUpperCase();
        if (!["USD", "NPR"].includes(sanitizedCurrency)) {
          return NextResponse.json(
            {
              error: true,
              message: "Invalid currency. Must be USD or NPR",
            } as ApiResponse,
            { status: 400, headers: corsHeaders }
          );
        }
        updateData.currency = {
          currency: sanitizedCurrency,
          updatedAt: new Date(),
        };
      }
      if (parsedData.googleAnalytics?.trackingId) {
        if (!/^G-[A-Z0-9]{10}$/.test(parsedData.googleAnalytics.trackingId)) {
          return NextResponse.json(
            {
              error: true,
              message: "Invalid Google Analytics tracking ID format",
            } as ApiResponse,
            { status: 400, headers: corsHeaders }
          );
        }
        updateData.googleAnalytics = {
          trackingId: parsedData.googleAnalytics.trackingId,
          updatedAt: new Date(),
        };
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "No valid settings data provided",
        } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    // Update settings with a simplified approach
    const updatedSettings = await Settings.findOneAndUpdate(
      {},
      { $set: updateData },
      { new: true, upsert: true }
    );

    const responseData: ApiResponse<ISettings> = {
      error: false,
      message: "Settings updated successfully",
      data: updatedSettings.toObject(),
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Update Settings Error:", error);
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
