import { hasAuth } from "@/lib/hasAuth";
import { connectDB } from "@/lib/mongodb";
import { ApiResponse, CartItem } from "@/types";
import { NextResponse, NextRequest } from "next/server";
import mongoose from "mongoose";
import { Cart } from "@/models/Cart";
import { Product } from "@/models/Products";
import { v4 as uuidv4 } from "uuid";
import sanitizeHtml from "sanitize-html";

// Maximum quantity per item to prevent abuse
const MAX_QUANTITY = 100;

// Maximum number of items in cart
const MAX_CART_ITEMS = 50;

// Define User type to avoid 'any'
interface User {
  _id: mongoose.Types.ObjectId;
}

/**
 * Helper function to get or create a cart based on user authentication status
 */
async function getOrCreateCart(
  user: User | null,
  sessionId: string | null,
  req: NextRequest
) {
  let cartQuery: { customerId?: mongoose.Types.ObjectId; sessionId?: string };
  let newCartData: {
    customerId?: mongoose.Types.ObjectId;
    sessionId?: string;
    items: CartItem[];
  };
  let responseCookies: NextResponse | null = null;

  if (user) {
    // Authenticated user: use customerId
    cartQuery = { customerId: user._id };
    newCartData = { customerId: user._id, items: [] };
  } else {
    // Guest user: use sessionId from parameter, cookie, or generate a new one
    const cartSessionId =
      sessionId || req.cookies.get("cartSessionId")?.value || uuidv4();

    cartQuery = { sessionId: cartSessionId };
    newCartData = { sessionId: cartSessionId, items: [] };

    // Set sessionId cookie for guest users if we generated a new one
    if (!sessionId && !req.cookies.get("cartSessionId")?.value) {
      responseCookies = NextResponse.json({});
      responseCookies.cookies.set("cartSessionId", cartSessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
      });
    }
  }

  // Find or create cart
  let cart = await Cart.findOne(cartQuery);
  if (!cart) {
    cart = new Cart(newCartData);
    await cart.save();
  }

  return { cart, responseCookies };
}

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const { user } = await hasAuth(req);

    // Parse request body
    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json(
        { error: true, message: "Request body is required" } as ApiResponse,
        { status: 400 }
      );
    }
    const body = JSON.parse(rawBody);

    const { productId, quantity, sessionId: providedSessionId } = body;

    // Validate inputs
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: true, message: "Invalid product ID" } as ApiResponse,
        { status: 400 }
      );
    }

    if (
      !quantity ||
      typeof quantity !== "number" ||
      quantity <= 0 ||
      quantity > MAX_QUANTITY
    ) {
      return NextResponse.json(
        {
          error: true,
          message: `Quantity must be a number between 1 and ${MAX_QUANTITY}`,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Sanitize sessionId if provided
    const sanitizedSessionId = providedSessionId
      ? sanitizeHtml(providedSessionId, {
          allowedTags: [],
          allowedAttributes: {},
        })
      : null;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: true, message: "Product not found" } as ApiResponse,
        { status: 404 }
      );
    }

    // Validate stock
    if (product.stock < quantity) {
      return NextResponse.json(
        { error: true, message: "Insufficient stock" } as ApiResponse,
        { status: 400 }
      );
    }

    // Determine cart identifier
    let cartQuery: { customerId?: mongoose.Types.ObjectId; sessionId?: string };
    let newCartData: {
      customerId?: mongoose.Types.ObjectId;
      sessionId?: string;
      items: CartItem[]; // Changed from any[] to CartItem[]
    };
    let responseCookies: NextResponse | null = null;

    if (user) {
      // Authenticated user: use customerId
      cartQuery = { customerId: user._id };
      newCartData = { customerId: user._id, items: [] };

      // Merge guest cart if sessionId is provided
      if (sanitizedSessionId) {
        const guestCart = await Cart.findOne({ sessionId: sanitizedSessionId });
        if (guestCart) {
          let cart = await Cart.findOne(cartQuery);
          if (!cart) {
            cart = new Cart(newCartData);
          }
          // Merge items
          guestCart.items.forEach((guestItem) => {
            const existingItem = cart!.items.find(
              (item) =>
                item.productId.toString() === guestItem.productId.toString()
            );
            if (existingItem) {
              existingItem.quantity = Math.min(
                existingItem.quantity + guestItem.quantity,
                MAX_QUANTITY
              );
            } else if (cart!.items.length < MAX_CART_ITEMS) {
              cart!.items.push(guestItem);
            }
          });
          await cart.save();
          await guestCart.deleteOne(); // Remove guest cart
          // Continue with adding new item
          cartQuery = { customerId: user._id }; // Reset query to user's cart
        }
      }
    } else {
      // Guest user: use or generate sessionId
      const sessionId = sanitizedSessionId || uuidv4();
      cartQuery = { sessionId };
      newCartData = { sessionId, items: [] };

      // Set sessionId cookie for guest users
      if (!sanitizedSessionId) {
        responseCookies = NextResponse.json(null);
        responseCookies.cookies.set("cartSessionId", sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: "/",
        });
      }
    }

    // Find or create cart
    let cart = await Cart.findOne(cartQuery);
    if (!cart) {
      cart = new Cart(newCartData);
    }

    // Check cart item limit
    if (
      cart.items.length >= MAX_CART_ITEMS &&
      !cart.items.some((item) => item.productId.toString() === productId)
    ) {
      return NextResponse.json(
        {
          error: true,
          message: `Cart cannot exceed ${MAX_CART_ITEMS} unique items`,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Check if product is already in the cart
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      // Update quantity if item exists
      existingItem.quantity = Math.min(
        existingItem.quantity + quantity,
        MAX_QUANTITY
      );
    } else {
      // Add new item with product details
      cart.items.push({
        productId: new mongoose.Types.ObjectId(productId),
        name: product.name,
        image: product.images?.[0] || "",
        price: product.price,
        quantity,
      });
    }

    await cart.save();

    const responseData: ApiResponse<CartItem[]> = {
      error: false,
      message: "Product added to cart successfully",
      data: cart.items,
    };
    if (responseCookies) {
      // Add the response data to the existing response
      return new NextResponse(JSON.stringify(responseData), {
        status: 201,
        headers: responseCookies.headers,
      });
    } else {
      return NextResponse.json(responseData, { status: 201 });
    }
  } catch (error) {
    console.error("Add to Cart Error:", error);
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
  const { user } = await hasAuth(req);

  try {
    let cartQuery: { customerId?: mongoose.Types.ObjectId; sessionId?: string };

    if (user) {
      // Authenticated user: use customerId
      cartQuery = { customerId: user._id };
    } else {
      // Guest user: use sessionId from cookie or query
      const sessionId =
        req.cookies.get("cartSessionId")?.value ||
        req.nextUrl.searchParams.get("sessionId");
      if (!sessionId) {
        return NextResponse.json(
          {
            error: false,
            message: "No cart found for guest user",
            data: [],
          } as ApiResponse<CartItem[]>,
          { status: 200 }
        );
      }
      cartQuery = { sessionId };
    }

    const cart = await Cart.findOne(cartQuery).populate("items.productId");

    const responseData: ApiResponse<CartItem[]> = {
      error: false,
      message: cart ? "Cart retrieved successfully" : "No cart found",
      data: cart ? cart.items : [],
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Get Cart Error:", error);
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

export async function PATCH(req: NextRequest) {
  await connectDB();

  try {
    const { user, response } = await hasAuth(req);
    if (response) return response;

    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json(
        { error: true, message: "Request body is required" } as ApiResponse,
        { status: 400 }
      );
    }
    const body = JSON.parse(rawBody);

    const { productId, quantity, sessionId: providedSessionId } = body;

    // Validate inputs
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: true, message: "Invalid product ID" } as ApiResponse,
        { status: 400 }
      );
    }

    if (
      !quantity ||
      typeof quantity !== "number" ||
      quantity <= 0 ||
      quantity > MAX_QUANTITY
    ) {
      return NextResponse.json(
        {
          error: true,
          message: `Quantity must be a number between 1 and ${MAX_QUANTITY}`,
        } as ApiResponse,
        { status: 400 }
      );
    }

    // Sanitize sessionId
    const sanitizedSessionId = providedSessionId
      ? sanitizeHtml(providedSessionId, {
          allowedTags: [],
          allowedAttributes: {},
        })
      : null;

    // Check product
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { error: true, message: "Product not found" } as ApiResponse,
        { status: 404 }
      );
    }

    // Validate stock
    if (product.stock < quantity) {
      return NextResponse.json(
        { error: true, message: "Insufficient stock" } as ApiResponse,
        { status: 400 }
      );
    }

    // Get or create cart
    const { cart, responseCookies } = await getOrCreateCart(
      user,
      sanitizedSessionId,
      req
    );

    // Find item
    const existingItem = cart.items.find(
      (item: CartItem) => item.productId.toString() === productId
    );

    if (!existingItem) {
      return NextResponse.json(
        { error: true, message: "Item not found in cart" } as ApiResponse,
        { status: 404 }
      );
    }

    // Update quantity
    existingItem.quantity = quantity;
    existingItem.name = product.name;
    existingItem.image = product.images?.[0] || "";
    existingItem.price = product.price;

    await cart.save();

    const responseData: ApiResponse<CartItem[]> = {
      error: false,
      message: "Cart item updated successfully",
      data: cart.items,
    };

    if (responseCookies) {
      // Add the response data to the existing response
      return new NextResponse(JSON.stringify(responseData), {
        status: 200,
        headers: responseCookies.headers,
      });
    } else {
      return NextResponse.json(responseData, { status: 200 });
    }
  } catch (error) {
    console.error("Update Cart Error:", error);
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

export async function DELETE(req: NextRequest) {
  await connectDB();

  try {
    const { user, response } = await hasAuth(req);
    if (response) return response;

    const rawBody = await req.text();
    if (!rawBody) {
      return NextResponse.json(
        { error: true, message: "Request body is required" } as ApiResponse,
        { status: 400 }
      );
    }
    const body = JSON.parse(rawBody);

    const { productId, sessionId: providedSessionId } = body;

    // Validate inputs
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: true, message: "Invalid product ID" } as ApiResponse,
        { status: 400 }
      );
    }

    // Sanitize sessionId
    const sanitizedSessionId = providedSessionId
      ? sanitizeHtml(providedSessionId, {
          allowedTags: [],
          allowedAttributes: {},
        })
      : null;

    // Get or create cart
    const { cart, responseCookies } = await getOrCreateCart(
      user,
      sanitizedSessionId,
      req
    );

    // Find item index
    const itemIndex = cart.items.findIndex(
      (item: CartItem) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: true, message: "Item not found in cart" } as ApiResponse,
        { status: 404 }
      );
    }

    // Remove item
    cart.items.splice(itemIndex, 1);

    // Delete cart if empty
    if (cart.items.length === 0) {
      await cart.deleteOne();
      const responseData: ApiResponse<CartItem[]> = {
        error: false,
        message: "Cart item removed and cart deleted",
        data: [],
      };
      if (responseCookies) {
        // Add the response data to the existing response
        return new NextResponse(JSON.stringify(responseData), {
          status: 200,
          headers: responseCookies.headers,
        });
      } else {
        return NextResponse.json(responseData, { status: 200 });
      }
    }

    await cart.save();

    const responseData: ApiResponse<CartItem[]> = {
      error: false,
      message: "Cart item removed successfully",
      data: cart.items,
    };

    if (responseCookies) {
      // Add the response data to the existing response
      return new NextResponse(JSON.stringify(responseData), {
        status: 200,
        headers: responseCookies.headers,
      });
    } else {
      return NextResponse.json(responseData, { status: 200 });
    }
  } catch (error) {
    console.error("Delete Cart Item Error:", error);
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
