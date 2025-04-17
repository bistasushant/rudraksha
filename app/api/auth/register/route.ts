import { hashPassword } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateRole } from "@/lib/validation";
import Admin from "@/models/Admin";
import { ApiResponse, RegisterResponseData, AdminRole } from "@/types";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

async function getCurrentUserRole(req: Request): Promise<AdminRole | null> {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return null;
  }
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-secret-key"
    ) as {
      email: string;
      role: AdminRole;
    };
    return decoded.role;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Check if this is the first user (bypass RBAC for initial admin setup)
    const adminCount = await Admin.countDocuments();
    const isInitialSetup = adminCount === 0;

    // Get current user's role and enforce admin-only registration (unless initial setup)
    const currentUserRole = await getCurrentUserRole(req);
    if (
      !isInitialSetup &&
      (!currentUserRole || !validateRole(currentUserRole, "admin"))
    ) {
      return NextResponse.json(
        {
          error: true,
          message: "Unauthorized: Only admins can register new users",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Parse request body
    const { email, name, password, confirmPassword, role } = body;

    // Validate required fields
    if (!email || !name || !password || !confirmPassword || !role) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Email, name, password, confirmPassword, and role (admin, editor, or user) are required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: true, message: "Invalid email format" } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate name
    if (!name.trim()) {
      return NextResponse.json(
        { error: true, message: "Name cannot be empty" } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate password and confirmPassword
    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          error: true,
          message: "Password and confirmPassword must match",
        } as ApiResponse,
        { status: 400 }
      );
    }
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate role
    const validRoles: AdminRole[] = ["admin", "editor", "user"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: true, message: "Invalid role" } as ApiResponse,
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeInput(email);
    const sanitizedName = sanitizeInput(name);

    // Check for existing user
    const existingAdmin = await Admin.findOne({ email: sanitizedEmail });
    if (existingAdmin) {
      return NextResponse.json(
        { error: true, message: "Email already exists" } as ApiResponse,
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const newAdmin = await Admin.create({
      email: sanitizedEmail,
      name: sanitizedName,
      password: hashedPassword,
      role,
      image: "",
    });

    const responseData: ApiResponse<RegisterResponseData> = {
      error: false,
      message: `${
        role.charAt(0).toUpperCase() + role.slice(1)
      } added successfully`,
      data: {
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
      },
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    // Check admin authentication
    const currentUserRole = await getCurrentUserRole(req);
    if (!currentUserRole || !validateRole(currentUserRole, "admin")) {
      return NextResponse.json(
        {
          error: true,
          message: "Unauthorized: Only admins can update users",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await req.json();
    const { targetEmail, email, name, password, confirmPassword, role, image } =
      body;

    // Validate target email
    if (!targetEmail) {
      return NextResponse.json(
        { error: true, message: "Target email is required" } as ApiResponse,
        { status: 400 }
      );
    }
    const sanitizedTargetEmail = sanitizeInput(targetEmail);

    // Prepare update object
    const update: Partial<
      RegisterResponseData & { password?: string; image?: string }
    > = {};

    // Validate and sanitize inputs
    if (email) {
      update.email = sanitizeInput(email);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(update.email)) {
        return NextResponse.json(
          { error: true, message: "Invalid email format" } as ApiResponse,
          { status: 400 }
        );
      }
    }
    if (name) {
      update.name = sanitizeInput(name);
      if (!name.trim()) {
        return NextResponse.json(
          { error: true, message: "Name cannot be empty" } as ApiResponse,
          { status: 400 }
        );
      }
    }
    if (password) {
      if (!confirmPassword || password !== confirmPassword) {
        return NextResponse.json(
          {
            error: true,
            message: "Password and confirmPassword are required and must match",
          } as ApiResponse,
          { status: 400 }
        );
      }
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return NextResponse.json(
          {
            error: true,
            message:
              "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character",
          } as ApiResponse,
          { status: 400 }
        );
      }
      update.password = await hashPassword(password);
    }
    if (role) {
      const validRoles: AdminRole[] = ["admin", "editor", "user"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: true, message: "Invalid role" } as ApiResponse,
          { status: 400 }
        );
      }
      update.role = role;
    }
    if (image !== undefined) {
      update.image = sanitizeInput(image || "");
    }

    // Check if user exists
    const user = await Admin.findOne({ email: sanitizedTargetEmail });
    if (!user) {
      return NextResponse.json(
        { error: true, message: "User not found" } as ApiResponse,
        { status: 404 }
      );
    }

    // Check for email conflict
    if (update.email && update.email !== sanitizedTargetEmail) {
      const existingUser = await Admin.findOne({ email: update.email });
      if (existingUser) {
        return NextResponse.json(
          { error: true, message: "Email already exists" } as ApiResponse,
          { status: 409 }
        );
      }
    }

    // Apply updates
    const updatedUser = await Admin.findOneAndUpdate(
      { email: sanitizedTargetEmail },
      { $set: update },
      { new: true, runValidators: true }
    ).select("email name role image -_id");

    if (!updatedUser) {
      return NextResponse.json(
        { error: true, message: "Failed to update user" } as ApiResponse,
        { status: 500 }
      );
    }

    const responseData: ApiResponse<RegisterResponseData> = {
      error: false,
      message: "User updated successfully",
      data: {
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    // Check admin authentication
    const currentUserRole = await getCurrentUserRole(req);
    if (!currentUserRole || !validateRole(currentUserRole, "admin")) {
      return NextResponse.json(
        {
          error: true,
          message: "Unauthorized: Only admins can delete users",
        } as ApiResponse,
        { status: 403 }
      );
    }

    // Connect to database
    await connectDB();

    // Parse request body
    const body = await req.json();
    const { targetEmail } = body;

    // Validate target email
    if (!targetEmail) {
      return NextResponse.json(
        { error: true, message: "Target email is required" } as ApiResponse,
        { status: 400 }
      );
    }
    const sanitizedTargetEmail = sanitizeInput(targetEmail);

    // Check if user exists
    const user = await Admin.findOne({ email: sanitizedTargetEmail });
    if (!user) {
      return NextResponse.json(
        { error: true, message: "User not found" } as ApiResponse,
        { status: 404 }
      );
    }

    // Prevent self-deletion
    interface JwtPayload {
      email: string;
      role: AdminRole;
    }
    const currentUserEmail = (
      jwt.decode(
        req.headers.get("Authorization")?.split(" ")[1] || ""
      ) as JwtPayload
    )?.email;
    if (currentUserEmail === sanitizedTargetEmail) {
      return NextResponse.json(
        {
          error: true,
          message: "Cannot delete your own account",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Delete user
    await Admin.deleteOne({ email: sanitizedTargetEmail });

    return NextResponse.json({
      error: false,
      message: "User deleted successfully",
    } as ApiResponse);
  } catch (error) {
    console.error("User deletion error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
