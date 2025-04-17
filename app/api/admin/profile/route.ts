import { hasAuth } from "@/lib/hasAuth";
import { NextRequest, NextResponse } from "next/server";
import Admin from "@/models/Admin";
import { ApiResponse } from "@/types";
import { connectDB } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const { admin, response } = await hasAuth(req);
    if (response) return response;

    if (admin.role !== "admin") {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: Only admins can access this resource",
        } as ApiResponse,
        { status: 403 }
      );
    }

    await connectDB();

    const allProfiles = await Admin.find().select("email name role image -_id");
    if (!allProfiles || allProfiles.length === 0) {
      return NextResponse.json(
        { error: true, message: "No profiles found" } as ApiResponse,
        { status: 404 }
      );
    }

    return NextResponse.json({
      error: false,
      message: "All profiles retrieved successfully",
      data: allProfiles,
    } as ApiResponse);
  } catch (error) {
    console.error("Profiles retrieval error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
