import { hasAuth } from "@/lib/hasAuth";
import { connectDB } from "@/lib/mongodb";
import { sanitizeInput, validateAddProductRequest } from "@/lib/validation";
import { Product } from "@/models/Products";
import { Category } from "@/models/Category";
import { ApiResponse, IProduct } from "@/types";
import { NextResponse, NextRequest } from "next/server";
import mongoose from "mongoose";

// Type for lean Product document
interface LeanProduct {
  _id: string;
  name: string;
  slug: string;
  category: mongoose.Types.ObjectId[];
  price: number;
  stock: number;
  description: string;
  benefit: string;
  images: string[];
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
        message: "Forbidden: Only admins and editors can add products",
      } as ApiResponse,
      { status: 403 }
    );
  }

  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    if (body.image && !body.images) {
      body.images = Array.isArray(body.image) ? body.image : [body.image];
      delete body.image;
    }

    if (!validateAddProductRequest(body, user.role)) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid product data provided",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const { name, slug, category, price, stock, description, benefit, images } =
      body;

    const validCategories = category.map(
      (cat: string) => new mongoose.Types.ObjectId(cat)
    );

    const existingCategories = await Category.find({
      _id: { $in: validCategories },
    }).lean();
    if (existingCategories.length !== validCategories.length) {
      return NextResponse.json(
        {
          error: true,
          message: "One or more categories are invalid",
        } as ApiResponse,
        { status: 400 }
      );
    }

    const productSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const existingProduct = await Product.findOne({ slug: productSlug });
    if (existingProduct) {
      return NextResponse.json(
        { error: true, message: "Slug already in use" } as ApiResponse,
        { status: 400 }
      );
    }

    let processedImages: string[] = [];
    if (images && Array.isArray(images)) {
      processedImages = images.filter(
        (img) =>
          typeof img === "string" &&
          img.startsWith("data:image") &&
          img.includes("base64,")
      );
    } else {
      processedImages = [];
    }

    const productData = {
      name: sanitizeInput(name),
      slug: productSlug,
      category: validCategories,
      price,
      stock,
      description: description ? sanitizeInput(description) : "",
      benefit: benefit ? sanitizeInput(benefit) : "",
      images: processedImages,
    };

    const product = new Product(productData);
    const savedProduct = await product.save();
    const productObject = savedProduct.toObject();

    // Ensure no stray fields and images is an array
    delete productObject.image;
    productObject.images = Array.isArray(productObject.images)
      ? productObject.images
      : [];

    const responseData: ApiResponse<IProduct> = {
      error: false,
      message: "Product added successfully",
      data: productObject,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Add Product Error:", error);
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
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments();
    const products = await Product.find({})
      .select("-image")
      .skip(skip)
      .limit(limit)
      .lean<LeanProduct[]>();

    const sanitizedProducts = products.map((product) => {
      const images = Array.isArray(product.images) ? product.images : [];
      return {
        id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        category: product.category.map((cat) => cat.toString()),
        price: product.price,
        stock: product.stock,
        description: product.description || "",
        benefit: product.benefit || "",
        images,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      };
    });

    // New: Count products added this month
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    const newProductsCount = await Product.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    const responseData: ApiResponse<{
      products: IProduct[];
      total: number;
      newProductsCount: number;
      page: number;
      totalPages: number;
    }> = {
      error: false,
      message: "Products retrieved successfully",
      data: {
        products: sanitizedProducts,
        total,
        newProductsCount,
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
    console.error("Get Products Error:", error);
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
