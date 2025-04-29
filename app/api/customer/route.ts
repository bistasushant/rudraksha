import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User"; // Use User model
import { ApiResponse } from "@/types";
import { hasAuth } from "@/lib/auth"; // Correct import

interface UserProfile {
  id: string;
  name: string;
  email: string;
  contactNumber: string | null;
  image: string | null;
}

interface GetUsersResponseData {
  users: UserProfile[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
  };
  newCustomersCount: number; // Add new field for customers since last week
}

export async function GET(req: NextRequest) {
  try {
    // Verify authentication and get user data
    const { user, response } = await hasAuth(req);

    // Return early if authentication failed
    if (response) {
      return response;
    }

    // Restrict access to admin and editor roles
    const allowedRoles = ["admin", "editor"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: Insufficient permissions",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Extract and validate query parameters
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(
      1,
      Math.min(100, parseInt(searchParams.get("limit") || "10"))
    ); // Cap limit at 100
    const skip = (page - 1) * limit;

    // Calculate the date for "since last week"
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Fetch paginated users
    const users = await User.find({ role: "customer" }) // Only fetch customers
      .select("email name contactNumber image createdAt updatedAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: true, message: "No customer found" } as ApiResponse,
        { status: 404 }
      );
    }

    // Map users to response format
    const formattedUsers: UserProfile[] = users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber || null,
      image: user.image || null,
    }));

    // Get total count for pagination
    const total = await User.countDocuments({ role: "customer" });

    // Get count of new customers since last week
    const newCustomersCount = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: oneWeekAgo },
    });

    // Prepare response
    const responseData: ApiResponse<GetUsersResponseData> = {
      error: false,
      message: "Customers retrieved successfully",
      data: {
        users: formattedUsers,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
        newCustomersCount, // Include new customers count
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("customer retrieval error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Handle specific MongoDB errors
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ECONNREFUSED"
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
