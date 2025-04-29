import { hasAuth } from "@/lib/hasAuth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ApiResponse, UserRole } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { user, response } = await hasAuth(req);
    if (response) return response;

    // Check if user has one of the allowed roles
    const allowedRoles: UserRole[] = ["admin", "editor", "user"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        {
          error: true,
          message: "Forbidden: Insufficient permissions",
        } as ApiResponse,
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const query = email
      ? { email, role: { $in: ["admin", "editor", "user"] } }
      : { role: { $in: ["admin", "editor", "user"] } };

    const users = await User.find(query)
      .select("email name contactNumber image createdAt updatedAt role")
      .sort({ createdAt: -1 })
      .skip(email ? 0 : skip)
      .limit(email ? 1 : limit);

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: true, message: "No profiles found" } as ApiResponse,
        { status: 404 }
      );
    }

    const formattedUsers = users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber || "",
      image: user.image || "",
      role: user.role,
      createdAt: user.createdAt,
    }));

    if (email) {
      return NextResponse.json({
        error: false,
        message: "User profile retrieved successfully",
        data: formattedUsers,
      } as ApiResponse);
    }

    const total = await User.countDocuments({
      role: { $in: ["admin", "editor", "user"] },
    });
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newUsersCount = await User.countDocuments({
      createdAt: { $gte: oneWeekAgo },
      role: { $in: ["admin", "editor", "user"] },
    });

    return NextResponse.json({
      error: false,
      message: "All profiles retrieved successfully",
      data: formattedUsers,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      newUsersCount,
    } as ApiResponse);
  } catch (error) {
    console.error("Profiles retrieval error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
