import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import { getToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await connectDB();

  // Extract token
  const token = getToken(req);
  console.log("Auth/me - Received token:", token);

  if (!token) {
    console.log("Auth/me - No token provided");
    return NextResponse.json(
      { error: true, message: "Unauthorized: No token provided" },
      { status: 401 }
    );
  }

  try {
    // Verify token with JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      email: string;
      role: string;
    };
    console.log("Auth/me - Token decoded:", decoded);

    // Fetch admin from database
    const admin = await Admin.findOne({ email: decoded.email }).select(
      "-password"
    );

    if (!admin) {
      console.log("Auth/me - Admin not found for email:", decoded.email);
      return NextResponse.json(
        { error: true, message: "Unauthorized: Admin not found" },
        { status: 401 }
      );
    }

    console.log("Auth/me - Admin data retrieved:", {
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    // Return admin data
    return NextResponse.json({
      data: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role || decoded.role || "user",
      },
    });
  } catch (error) {
    console.error("Auth/me - Error verifying token:", error);
    return NextResponse.json(
      { error: true, message: "Unauthorized: Invalid token" },
      { status: 401 }
    );
  }
}
