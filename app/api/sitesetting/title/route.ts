import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Title from "@/models/Title";
import { ApiResponse, ITitle } from "@/types";
import { hasAuth } from "@/lib/hasAuth";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "GET, POST",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function GET() {
  await connectDB();

  try {
    const title = (await Title.findOne().lean()) as ITitle | null;
    const responseData: ApiResponse<ITitle | null> = {
      error: false,
      message: title ? "Title retrieved successfully" : "No title found",
      data: title || null,
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("Get Title Error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { admin, response } = await hasAuth(req);
  if (!admin || response) {
    return (
      response ||
      NextResponse.json(
        { error: true, message: "Unauthorized" } as ApiResponse,
        { status: 401, headers: corsHeaders }
      )
    );
  }

  if (admin.role !== "admin") {
    return NextResponse.json(
      {
        error: true,
        message: "Forbidden: Only administrators can manage titles",
      } as ApiResponse,
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const rawBody = await req.text();
    const body: { title: string } = JSON.parse(rawBody);
    const titleData: ITitle = {
      title: body.title,
    };

    // Check if any title exists
    const existingTitle = await Title.findOne().lean();

    if (!existingTitle) {
      // If no title exists, create new
      const title = new Title(titleData);
      await title.save();

      const responseData: ApiResponse<ITitle> = {
        error: false,
        message: "Title added successfully",
        data: title.toObject() as ITitle, // Convert Mongoose document to plain object
      };

      return NextResponse.json(responseData, {
        status: 201,
        headers: corsHeaders,
      });
    } else {
      // If title exists, update it
      const updatedTitle = await Title.findOneAndUpdate(
        {},
        { title: body.title },
        { new: true, lean: true } // Use lean to return plain object
      );

      if (!updatedTitle) {
        return NextResponse.json(
          {
            error: true,
            message: "Title not found",
          } as ApiResponse,
          { status: 404, headers: corsHeaders }
        );
      }

      const responseData: ApiResponse<ITitle> = {
        error: false,
        message: "Title updated successfully",
        data: updatedTitle as ITitle,
      };

      return NextResponse.json(responseData, {
        status: 200,
        headers: corsHeaders,
      });
    }
  } catch (error) {
    console.error("Manage Title Error:", error);
    return NextResponse.json(
      {
        error: true,
        message: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse,
      { status: 500, headers: corsHeaders }
    );
  }
}
