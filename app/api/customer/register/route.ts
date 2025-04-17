import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";
import { sanitizeInput } from "@/lib/validation";
import Customer from "@/models/Customer";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.APP_URL || "http://localhost:3000",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS: Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders });
}

// POST: Customer registration
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Parse request body
    const { userName, password, confirmPassword, email, contactNumber } = body;

    // Validate required fields
    if (
      !email ||
      !userName ||
      !password ||
      !confirmPassword ||
      !contactNumber
    ) {
      return NextResponse.json(
        { error: true, message: "All fields are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: true, message: "Invalid email format" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate userName
    if (!userName.trim()) {
      return NextResponse.json(
        { error: true, message: "Username cannot be empty" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate password and confirmPassword match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: true, message: "Passwords do not match" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Sanitize input data
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedUserName = sanitizeInput(userName);
    const sanitizedContactNumber = sanitizeInput(contactNumber);

    // Check for existing customer
    const existingCustomer = await Customer.findOne({ email: sanitizedEmail });
    if (existingCustomer) {
      return NextResponse.json(
        { error: true, message: "Email already exists" },
        { status: 409, headers: corsHeaders }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Create customer with correct field names
    const newCustomer = await Customer.create({
      email: sanitizedEmail,
      userName: sanitizedUserName,
      password: hashedPassword,
      contactNumber: sanitizedContactNumber,
      role: "customer",
    });

    // Prepare response data
    const responseData = {
      error: false,
      message: "Registration successful!",
      data: {
        email: newCustomer.email,
        userName: newCustomer.userName,
        role: newCustomer.role,
      },
    };

    return NextResponse.json(responseData, {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
