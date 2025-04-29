import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User"; // Use User model instead of Customer
import { ApiResponse } from "@/types";
import { hasAuth } from "@/lib/auth"; // Use hasAuth from auth utilities
import { sanitizeInput } from "@/lib/validation"; // For email sanitization

// Define the expected structure of the user profile response
interface UserProfileResponseData {
  email: string;
  name: string;
  role: string;
  image?: string | null;
  contactNumber?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Define MongoDB error interface
interface MongoError extends Error {
  code?: string | number;
}

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    // Verify authentication and get user data
    const { user, response } = await hasAuth(req);

    // Return early if authentication failed (e.g., unauthorized)
    if (response) {
      return response;
    }

    // Validate and sanitize user email
    if (!user?.email) {
      return NextResponse.json(
        { error: true, message: "Invalid user data" } as ApiResponse,
        { status: 400 }
      );
    }
    const sanitizedEmail = sanitizeInput(user.email);

    // Find user profile by email (no need to call connectDB again, as hasAuth does it)
    const userProfile = await User.findOne({
      email: sanitizedEmail,
    }).select("email name role image contactNumber createdAt updatedAt -_id");

    if (!userProfile) {
      return NextResponse.json(
        { error: true, message: "User profile not found" } as ApiResponse,
        { status: 404 }
      );
    }

    // Ensure the user is a customer (role check)
    if (userProfile.role !== "customer") {
      return NextResponse.json(
        {
          error: true,
          message: "Unauthorized: Customer role required",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Prepare response data with explicit field mapping
    const responseData: ApiResponse<UserProfileResponseData> = {
      error: false,
      message: "User profile retrieved successfully",
      data: {
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        image: userProfile.image || null,
        contactNumber: userProfile.contactNumber || null, // Adjust if phone is not in schema
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Error retrieving user profile:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (
      error instanceof Error &&
      (error as MongoError).code === "ECONNREFUSED"
    ) {
      return NextResponse.json(
        { error: true, message: "Database connection failed" } as ApiResponse,
        { status: 503 }
      );
    }

    // Generic server error
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
