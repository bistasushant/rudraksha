import { hasAuth } from "@/lib/hasAuth";
import { NextRequest, NextResponse } from "next/server";
import Admin from "@/models/Admin";
import { sanitizeEmail, validateChangeEmailRequest } from "@/lib/validation";
import { ApiResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { admin, response } = await hasAuth(req);
    if (response) return response;

    const body = await req.json();
    if (!validateChangeEmailRequest(body)) {
      return NextResponse.json(
        { error: true, mesage: "Invalid request format" },
        { status: 400 }
      );
    }

    const { newEmail } = body;
    const sanitizedEmail = sanitizeEmail(newEmail);

    const existingUser = await Admin.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: true, message: "Email is already in use" },
        { status: 400 }
      );
    }
    await Admin.updateOne({ email: admin.email }, { email: sanitizedEmail });

    return NextResponse.json({
      error: false,
      message: "Email updated successfully",
    } as ApiResponse);
  } catch (error) {
    console.error("Change email error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" },
      { status: 500 }
    );
  }
}
