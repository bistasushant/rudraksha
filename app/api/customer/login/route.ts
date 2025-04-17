import { comparePassword, generateCustomerToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateLoginRequest } from "@/lib/validation";
import Customer from "@/models/Customer";
import { ApiResponse, CustomerLoginResponseData } from "@/types";
import { NextResponse } from "next/server";

// CORS headers with configurable origin
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.APP_URL || "*", // Changed to * as fallback for broader compatibility
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true", // Added for credentials support
};

// OPTIONS: Handle CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: corsHeaders,
    }
  );
}

// POST: Customer login
export async function POST(req: Request) {
  try {
    // Apply CORS headers to all responses
    const baseHeaders = { ...corsHeaders };

    await connectDB();

    const body = await req.json();

    // Validate login request
    if (!validateLoginRequest(body)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid request format. Email and password are required",
        } as ApiResponse,
        { status: 400, headers: baseHeaders }
      );
    }

    const { email, password } = body;
    const sanitizedEmail = sanitizeInput(email);

    // Fetch customer
    const customer = await Customer.findOne({ email: sanitizedEmail }).select(
      "email userName password image role"
    );

    // Check credentials
    if (!customer || !(await comparePassword(password, customer.password))) {
      return NextResponse.json(
        {
          error: true,
          message: "Incorrect email or password",
        } as ApiResponse,
        { status: 401, headers: baseHeaders }
      );
    }

    // Generate token
    const token = generateCustomerToken(customer.email, "customer");

    // Prepare response
    const responseData: ApiResponse<CustomerLoginResponseData> = {
      error: false,
      message: "Login successful",
      data: {
        token,
        email: customer.email,
        name: customer.userName,
        image: customer.image || "",
        role: "customer",
      },
    };

    // Add authorization header
    const responseHeaders = {
      ...baseHeaders,
      Authorization: `Bearer ${token}`,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Login Error:", error);
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
