import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { hasAuth } from "@/lib/hasAuth";
import { GoogleAnalyticsModel } from "@/models/GoogleAnalytics";
import {
  ApiResponse,
  IGoogleAnalytics,
  UpdateGoogleAnalyticsRequest,
} from "@/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000", // Adjust to your frontend URL
  "Access-Control-Allow-Methods": "GET, POST, PUT",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET() {
  await connectDB();

  try {
    const ga =
      (await GoogleAnalyticsModel.findOne().lean()) as IGoogleAnalytics | null;
    const responseData: ApiResponse<IGoogleAnalytics | null> = {
      error: false,
      message: ga
        ? "Tracking ID retrieved successfully"
        : "No tracking ID found",
      data: ga || null,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Get GA Error:", error);
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
        message: "Forbidden: Only administrators can manage Google Analytics",
      } as ApiResponse,
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const rawBody = await req.text();
    const body: UpdateGoogleAnalyticsRequest = JSON.parse(rawBody);

    const newGA = new GoogleAnalyticsModel({
      trackingId: body.trackingId,
      updatedAt: new Date(),
    });

    await newGA.save();

    const responseData: ApiResponse<IGoogleAnalytics> = {
      error: false,
      message: "Google Analytics tracking ID added successfully",
      data: newGA,
    };

    return NextResponse.json(responseData, {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Add GA Error:", error);
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
        message: "Forbidden: Only administrators can manage Google Analytics",
      } as ApiResponse,
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const rawBody = await req.text();
    const body: UpdateGoogleAnalyticsRequest = JSON.parse(rawBody);

    const updatedGA = await GoogleAnalyticsModel.findOneAndUpdate(
      {},
      {
        trackingId: body.trackingId,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedGA) {
      return NextResponse.json(
        {
          error: true,
          message: "Tracking ID not found",
        } as ApiResponse,
        { status: 404, headers: corsHeaders }
      );
    }

    const responseData: ApiResponse<IGoogleAnalytics> = {
      error: false,
      message: "Google Analytics tracking ID updated successfully",
      data: updatedGA,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Update GA Error:", error);
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
