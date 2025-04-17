import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Currency from "@/models/Currency";
import { hasAuth } from "@/lib/hasAuth";
import { ApiResponse } from "@/types";

// List of valid currency codes
const VALID_CURRENCIES = ["USD", "NPR"];

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB();

    // Check authentication
    const { admin, response } = await hasAuth(req);
    if (!admin || response) {
      return (
        response ||
        NextResponse.json<ApiResponse>(
          { error: true, message: "Unauthorized" },
          { status: 401 }
        )
      );
    }

    // Check admin role
    if (admin.role !== "admin") {
      return NextResponse.json<ApiResponse>(
        {
          error: true,
          message: "Forbidden: Only administrators can view currency settings",
        },
        { status: 403 }
      );
    }

    // Retrieve or create default currency setting
    let currencySetting = await Currency.findOne();
    if (!currencySetting) {
      currencySetting = await Currency.create({ currency: "USD" });
    }

    return NextResponse.json<ApiResponse>({
      error: false,
      message: "Currency setting retrieved successfully",
      data: { currency: currencySetting.currency },
    });
  } catch (error: unknown) {
    console.error("Error retrieving currency setting:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json<ApiResponse>(
      { error: true, message: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse>> {
  try {
    await connectDB();

    // Check authentication
    const { admin, response } = await hasAuth(req);
    if (!admin || response) {
      return (
        response ||
        NextResponse.json<ApiResponse>(
          { error: true, message: "Unauthorized" },
          { status: 401 }
        )
      );
    }

    // Check admin role
    if (admin.role !== "admin") {
      return NextResponse.json<ApiResponse>(
        {
          error: true,
          message:
            "Forbidden: Only administrators can manage currency settings",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { currency } = body;

    if (!currency || typeof currency !== "string") {
      return NextResponse.json<ApiResponse>(
        { error: true, message: "Currency is required and must be a string" },
        { status: 400 }
      );
    }

    // Sanitize and validate currency
    const sanitizedCurrency = currency.trim().toUpperCase();
    if (!VALID_CURRENCIES.includes(sanitizedCurrency)) {
      return NextResponse.json<ApiResponse>(
        {
          error: true,
          message: `Invalid currency. Must be one of: USD ($), NPR (Rs)`,
        },
        { status: 400 }
      );
    }

    // Update or create currency setting
    const existingCurrency = await Currency.findOne();

    if (existingCurrency) {
      existingCurrency.currency = sanitizedCurrency;
      await existingCurrency.save();
    } else {
      await Currency.create({ currency: sanitizedCurrency });
    }

    return NextResponse.json<ApiResponse>({
      error: false,
      message: "Currency setting updated successfully",
      data: { currency: sanitizedCurrency },
    });
  } catch (error: unknown) {
    console.error("Error saving currency setting:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";

    return NextResponse.json<ApiResponse>(
      {
        error: true,
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}
