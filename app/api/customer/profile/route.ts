import { hasAuthForCustomer } from "@/lib/cusAuth";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { ApiResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    // Authenticate the customer using hasAuthForCustomer function
    const { customer, response } = await hasAuthForCustomer(req);

    // If the customer is not authenticated, return the error response
    if (response) return response;

    await connectDB();

    // Retrieve the customer's profile from the database using their email (or another identifier)
    const customerProfile = await Customer.findOne({
      email: customer.email,
    }).select("email name role image phone createdAt updatedAt -_id");

    if (!customerProfile) {
      return NextResponse.json(
        { error: true, message: "Customer profile not found" } as ApiResponse,
        { status: 404 }
      );
    }

    // Return the customer's profile data
    return NextResponse.json({
      error: false,
      message: "Customer profile retrieved successfully",
      data: customerProfile,
    } as ApiResponse);
  } catch (error) {
    console.error("Error retrieving customer profile:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
