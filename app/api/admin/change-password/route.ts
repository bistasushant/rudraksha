import { comparePassword, hashPassword } from "@/lib/auth";
import { hasAuth } from "@/lib/hasAuth";
import { validateChangePasswordRequest } from "@/lib/validation";
import Admin from "@/models/Admin";
import { ApiResponse } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { admin, response } = await hasAuth(req);
    if (response) return response;

    const body = await req.json();
    if (!validateChangePasswordRequest(body, admin.role)) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Invalid request format. New password must be at least 8 characters with 1 uppercase, 1 special character, 1 lowercase, and 1 number",
        },
        { status: 400 }
      );
    }
    const { oldPassword, newPassword } = body;

    const fullAdmin = await Admin.findById(admin._id);
    if (!fullAdmin) {
      return NextResponse.json(
        { error: true, message: "Admin not found" },
        { status: 404 }
      );
    }

    if (!(await comparePassword(oldPassword, fullAdmin.password))) {
      return NextResponse.json(
        { error: true, message: "Invalid password" },
        { status: 400 }
      );
    }

    fullAdmin.password = await hashPassword(newPassword);
    await fullAdmin.save();

    return NextResponse.json({
      error: false,
      message: "Password changed successfully",
    } as ApiResponse);
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" },
      { status: 500 }
    );
  }
}
