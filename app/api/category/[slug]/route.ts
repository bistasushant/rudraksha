import { hasAuth } from "@/lib/hasAuth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateUpdateCategoryRequest } from "@/lib/validation";
import { Category } from "@/models/Category";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  await connectDB();
  const { user, response } = await hasAuth(req);
  if (!user || response) {
    return (
      response ||
      NextResponse.json(
        { error: true, message: "Unauthorized" },
        { status: 401 }
      )
    );
  }
  if (!["admin", "editor"].includes(user.role)) {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: You do not have permission to update categories",
      },
      { status: 403 }
    );
  }

  try {
    const pathname = req.nextUrl.pathname;
    const slug = pathname.split("/").pop();

    if (!slug) {
      return NextResponse.json(
        { error: true, message: "Slug not found in URL" },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!validateUpdateCategoryRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" },
        { status: 400 }
      );
    }

    const { name, description, isActive } = body;

    const updatedCategory = await Category.findOneAndUpdate(
      { slug },
      {
        ...(name && { name: sanitizeInput(name) }),
        ...(description && { description: sanitizeInput(description) }),
        ...(typeof isActive === "boolean" && { isActive }),
      },
      { new: true }
    );

    if (!updatedCategory) {
      return NextResponse.json(
        { error: true, message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: false,
        message: "Category updated successfully",
        data: updatedCategory,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Category Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  await connectDB();
  const { user, response } = await hasAuth(req);
  if (!user || response) {
    return (
      response ||
      NextResponse.json(
        { error: true, message: "Unauthorized" },
        { status: 401 }
      )
    );
  }

  // RBAC: Only admin can delete categories
  if (user.role !== "admin") {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: You do not have permission to delete categories",
      },
      { status: 403 }
    );
  }

  try {
    const pathname = req.nextUrl.pathname;
    const slug = pathname.split("/").pop();

    if (!slug) {
      return NextResponse.json(
        { error: true, message: "Slug not found in URL" },
        { status: 400 }
      );
    }

    const deletedCategory = await Category.findOneAndDelete({ slug });

    if (!deletedCategory) {
      return NextResponse.json(
        { error: true, message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: false, message: "Category deleted successfully" },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:3000",
          "Access-Control-Allow-Methods": "GET, POST",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Delete Category Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" },
      { status: 500 }
    );
  }
}
