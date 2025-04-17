import { comparePassword, generateToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateLoginRequest } from "@/lib/validation";
import Admin from "@/models/Admin";
import { ApiResponse, LoginResponseData } from "@/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!validateLoginRequest(body)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid request format. Email and password are required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const { email, password } = body;
    const sanitizedEmail = sanitizeInput(email);

    const admin = await Admin.findOne({ email: sanitizedEmail }).select(
      "email name password image role"
    );
    if (!admin || !(await comparePassword(password, admin.password))) {
      return NextResponse.json(
        {
          error: true,
          message: "Incorrect email or password",
        } as ApiResponse,
        { status: 401 }
      );
    }

    const token = generateToken(admin.email, admin.role);

    const responseData: ApiResponse<LoginResponseData> = {
      error: false,
      message: "Login successful",
      data: {
        token,
        email: admin.email,
        name: admin.name,
        image: admin.image,
        role: admin.role,
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
