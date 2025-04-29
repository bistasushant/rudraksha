import { hasAuth } from "@/lib/hasAuth";
import { connectDB } from "@/lib/mongodb";
import {
  sanitizeInput,
  validateAddBlogCategoryRequest,
} from "@/lib/validation";
import { blogCategory } from "@/models/BlogCategory";
import { ApiResponse, IBlogcategory } from "@/types";
import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

interface IBlogCategoryDocument {
  _id: Types.ObjectId;
  name: string;
  slug: string;
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

    const total = await blogCategory.countDocuments();
    const blogCategories = await blogCategory
      .find({})
      .skip(skip)
      .limit(limit)
      .lean<IBlogCategoryDocument[]>();
    const sanitizedBlogCategories = blogCategories.map((blogCategory) => ({
      id: blogCategory._id.toString(),
      name: blogCategory.name,
      slug: blogCategory.slug,
      createdAt: blogCategory.createdAt,
      updatedAt: blogCategory.updatedAt,
    }));

    const responseData: ApiResponse<{
      blogCategories: IBlogcategory[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Blog categories retrieved successfully",
      data: {
        blogCategories: sanitizedBlogCategories,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
    return NextResponse.json(responseData, {
      status: 200,
    });
  } catch (error) {
    console.error("Get Blog Categories Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
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
        { status: 401 }
      )
    );
  }
  try {
    const body = await req.json();

    if (!validateAddBlogCategoryRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }
    const { name, slug } = body;

    const existingBlogCategory = await blogCategory.findOne({ slug });
    if (existingBlogCategory) {
      return NextResponse.json(
        { error: true, message: "Slug already in use" } as ApiResponse,
        { status: 400 }
      );
    }

    const blogCategoryData = {
      name: sanitizeInput(name),
      slug: sanitizeInput(slug),
    };

    const blogCategories = new blogCategory(blogCategoryData);
    const savedBlogCategory = await blogCategories.save();

    const responseData: ApiResponse<IBlogcategory> = {
      error: false,
      message: "Blog category added successfully",
      data: savedBlogCategory.toObject(),
    };
    return NextResponse.json(responseData, {
      status: 200,
    });
  } catch (error) {
    console.error("Add Blog Category Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
