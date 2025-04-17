import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import { getToken } from "./auth";
import Admin from "@/models/Admin";

const SECRET = process.env.JWT_SECRET || "secret";

export async function hasAuth(req: NextRequest) {
  await connectDB();

  const token = getToken(req);
  if (!token)
    return {
      admin: null,
      response: NextResponse.json(
        {
          error: true,
          message: "Unauthorized",
        },
        { status: 401 }
      ),
    };

  try {
    const decoded = jwt.verify(token, SECRET) as {
      email: string;
      role: string;
    };

    const admin = await Admin.findOne({ email: decoded.email }).select(
      "-password"
    );

    if (!admin)
      return {
        admin: null,
        response: NextResponse.json(
          { error: true, message: "Unauthorized" },
          { status: 401 }
        ),
      };
    return {
      admin: admin,
      response: null,
    };
  } catch {
    return {
      admin: null,
      response: NextResponse.json(
        {
          error: true,
          mesage: "Unauthorized",
        },
        {
          status: 401,
        }
      ),
    };
  }
}
