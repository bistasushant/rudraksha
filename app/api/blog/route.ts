import { hasAuth } from "@/lib/hasAuth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateAddBlogRequest } from "@/lib/validation";
import { Blog } from "@/models/Blog";
import { blogCategory } from "@/models/BlogCategory";
import { ApiResponse, IBlog } from "@/types";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// Type for lean Blog document
interface LeanBlog {
  _id: string;
  name: string;
  slug: string;
  heading: string;
  category: mongoose.Types.ObjectId[];
  description: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
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
  if (!["admin", "editor"].includes(user.role)) {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: You do not have permission to add blogs",
      } as ApiResponse,
      { status: 403 }
    );
  }
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    if (!validateAddBlogRequest(body, user.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }

    const { name, slug, heading, category, description, image } = body;

    // Ensure category is a non-empty array
    if (!Array.isArray(category) || category.length === 0) {
      return NextResponse.json(
        {
          error: true,
          message: "At least one valid category is required",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Validate category IDs
    const validBlogCategories = category.map(
      (cat: string) => new mongoose.Types.ObjectId(cat)
    );
    const existingBlogCategories = await blogCategory
      .find({
        _id: { $in: validBlogCategories },
      })
      .lean();
    if (existingBlogCategories.length !== validBlogCategories.length) {
      return NextResponse.json(
        {
          error: true,
          message: "One or more blog categories are invalid",
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Generate slug
    const blogSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    // Check for existing slug
    const existingBlog = await Blog.findOne({ slug: blogSlug });
    if (existingBlog) {
      return NextResponse.json(
        { error: true, message: "Slug already in use" } as ApiResponse,
        { status: 400 }
      );
    }

    // Prepare blog data
    const blogData = {
      name: sanitizeInput(name),
      slug: blogSlug,
      heading: sanitizeInput(heading),
      category: validBlogCategories,
      description: sanitizeInput(description),
      image: image,
    };

    const blog = new Blog(blogData);

    // Ensure slug is set
    if (!blog.slug) {
      blog.slug = blogSlug;
    }

    const savedBlog = await blog.save();

    const responseData: ApiResponse<IBlog> = {
      error: false,
      message: "Blog added successfully",
      data: savedBlog.toObject(),
    };
    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Add Blog Error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  await connectDB();
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));
    const skip = (page - 1) * limit;

    // Fetch total count of blogs
    const total = await Blog.countDocuments();

    // Fetch blogs with pagination
    const blogs = await Blog.find({})
      .lean<LeanBlog[]>()
      .skip(skip)
      .limit(limit);

    // Sanitize and transform blog data
    const sanitizedBlog = blogs.map((blog) => {
      // Handle category field
      let categoryIds: string[] = [];
      if (Array.isArray(blog.category)) {
        const validIds = blog.category
          .filter((cat) => {
            const isValid = mongoose.Types.ObjectId.isValid(cat);
            if (!isValid) {
              console.warn(`Invalid category ID for blog ${blog._id}: ${cat}`);
            }
            return isValid;
          })
          .map((cat) => cat.toString());
        categoryIds = validIds;
      } else {
        console.warn(
          `Category field is not an array for blog ${blog._id}:`,
          blog.category
        );
      }

      return {
        id: blog._id.toString(),
        name: blog.name,
        slug: blog.slug,
        heading: blog.heading,
        category: categoryIds,
        description: blog.description,
        image: blog.image || "",
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
      };
    });

    // Log category IDs for debugging (remove in production)
    console.log(
      "Sanitized Blogs Categories:",
      sanitizedBlog.map((b) => ({ id: b.id, category: b.category }))
    );

    const responseData: ApiResponse<{
      blogs: IBlog[];
      total: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Blogs retrieved successfully",
      data: {
        blogs: sanitizedBlog,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin":
          process.env.NODE_ENV === "development"
            ? "http://localhost:3000"
            : "*",
        "Access-Control-Allow-Methods": "GET, POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Get Blogs Error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500 }
    );
  }
}
