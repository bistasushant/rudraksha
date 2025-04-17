import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

// Password hashing and comparison functions
export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
  return await bcrypt.compare(password, hash);
};

// Admin token generation
export function generateToken(email: string, role?: string): string {
  const payload = { email, role };
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "1h" });
}

// Customer-specific token generation
export function generateCustomerToken(email: string, role?: string): string {
  const payload = { email, role };
  return jwt.sign(payload, process.env.CUSTOMER_JWT_SECRET!, {
    expiresIn: "7d",
  });
}

// Extract token from request headers
export const getToken = (req: NextRequest) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return null;
  }
  return authHeader.split(" ")[1];
};
