import { hasAuth } from "@/lib/hasAuth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateAddBlogRequest } from "@/lib/validation";
import { Blog } from "@/models/Blog";
import { ApiResponse, IBlog } from "@/types";
import { NextRequest, NextResponse } from "next/server";

// Type for lean Blog document
interface LeanBlog {
  _id: string;
  name: string;
  slug: string;
  heading: string;
  description: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { admin, response } = await hasAuth(req);
  if (!admin || response) {
    return (
      response ||
      NextResponse.json(
        { error: true, message: "Unauthorized" } as ApiResponse,
        { status: 401 }
      )
    );
  }
  if (!["admin", "editor"].includes(admin.role)) {
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

    if (!validateAddBlogRequest(body, admin.role)) {
      return NextResponse.json(
        { error: true, message: "Invalid request format" } as ApiResponse,
        { status: 400 }
      );
    }

    const { name, slug, heading, description, image } = body;

    const blogSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const existingBlog = await Blog.findOne({ slug: blogSlug });
    if (existingBlog) {
      return NextResponse.json(
        { error: true, message: "Slug already in use" } as ApiResponse,
        { status: 400 }
      );
    }

    const blogData = {
      name: sanitizeInput(name),
      slug: blogSlug,
      heading: sanitizeInput(heading),
      description: sanitizeInput(description),
      image: image,
    };

    const blog = new Blog(blogData);

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

  // const { admin, response } = await hasAuth(req);
  // if (!admin || response) {
  //   return (
  //     response ||
  //     NextResponse.json(
  //       { error: true, message: "Unauthorized" } as ApiResponse,
  //       { status: 401 }
  //     )
  //   );
  // }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const total = await Blog.countDocuments();
    const blogs = await Blog.find({})
      .lean<LeanBlog[]>()
      .skip(skip)
      .limit(limit);
    const sanitizedBlog = blogs.map((blog) => ({
      id: blog._id.toString(),
      name: blog.name,
      slug: blog.slug,
      heading: blog.heading,
      description: blog.description,
      image: blog.image || "",
      createdAt: blog.createdAt,
      updatedAt: blog.updatedAt,
    }));

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
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Methods": "GET, POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Get Blogs Error:", error);
    return NextResponse.json(
      { error: true, message: "Internal server error" } as ApiResponse,
      { status: 500 }
    );
  }
}
