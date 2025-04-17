import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { getToken } from "./auth"; // Make sure you have a token extraction function
import Customer from "@/models/Customer";

// Use a customer-specific JWT secret
const CUSTOMER_JWT_SECRET =
  process.env.CUSTOMER_JWT_SECRET || "customer-secret-key";

export async function hasAuthForCustomer(req: NextRequest) {
  await connectDB();

  // Extract token from the Authorization header
  const token = getToken(req);
  if (!token) {
    return {
      customer: null,
      response: NextResponse.json(
        {
          error: true,
          message: "Unauthorized: No token provided",
        },
        { status: 401 }
      ),
    };
  }

  try {
    // Verify the JWT token with the customer-specific secret
    const decoded = jwt.verify(token, CUSTOMER_JWT_SECRET) as {
      email: string;
      role: string;
    };

    // Fetch the customer from the database based on the email in the decoded JWT
    const customer = await Customer.findOne({ email: decoded.email }).select(
      "-password"
    );

    // If no customer is found, return an unauthorized response
    if (!customer) {
      return {
        customer: null,
        response: NextResponse.json(
          { error: true, message: "Unauthorized: Customer not found" },
          { status: 401 }
        ),
      };
    }

    // Return customer data if the token is valid and customer exists
    return {
      customer: customer,
      response: null, // No error response, the customer is authenticated
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return {
      customer: null,
      response: NextResponse.json(
        { error: true, message: "Unauthorized: Invalid token" },
        { status: 401 }
      ),
    };
  }
}
