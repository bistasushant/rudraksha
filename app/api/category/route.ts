import { hasAuth } from "@/lib/hasAuth";
import { ApiResponse, ICategory } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { Category } from "@/models/Category";
import { sanitizeInput, validateAddCategoryRequest } from "@/lib/validation";
import { connectDB } from "@/lib/mongodb";
import { Types } from "mongoose";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000", // Adjust this to your frontend URL
  "Access-Control-Allow-Methods": "GET, POST",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Interface for MongoDB document (before mapping)
interface ICategoryDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const total = await Category.countDocuments();
    const categories = await Category.find({})
      .skip(skip)
      .limit(limit)
      .lean<ICategoryDocument[]>();
    const sanitizedCategories = categories.map((category) => ({
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));

    const responseData: ApiResponse<{
      categories: ICategory[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Categories retrieved successfully",
      data: {
        categories: sanitizedCategories,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
    return NextResponse.json(responseData, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { user, response } = await hasAuth(req);
  if (!user || response) {
    return (
      response ||
      NextResponse.json(
        { error: true, message: "Unauthorized" } as ApiResponse,
        { status: 401, headers: corsHeaders }
      )
    );
  }
  try {
    const body = await req.json();

    if (!validateAddCategoryRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    const { name, slug, description, isActive } = body;

    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug });
    if (existingCategory) {
      return NextResponse.json(
        { error: true, message: "Slug already in use" } as ApiResponse,
        { status: 400, headers: corsHeaders }
      );
    }

    const categoryData = {
      name: sanitizeInput(name),
      slug: sanitizeInput(slug),
      description: description ? sanitizeInput(description) : undefined,
      isActive: isActive ?? true, // Default to true if not provided
    };

    const category = new Category(categoryData);
    const savedCategory = await category.save();

    const responseData: ApiResponse<ICategory> = {
      error: false,
      message: "Category added successfully",
      data: savedCategory.toObject(),
    };
    return NextResponse.json(responseData, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Add Category Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500, headers: corsHeaders }
    );
  }
}
