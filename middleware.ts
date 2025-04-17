// middleware.ts - Protects routes based on user role
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// Define which paths are protected by which roles
const authConfig = {
  // Pages that require admin role
  adminRoutes: ["/admin/:path*"], // e.g., /admin/dashboard
  // Pages that require any authenticated user (customer or admin)
  protectedRoutes: ["/", "/profile", "/api/user/:path*"],
  // Pages that are only accessible to non-authenticated users
  authRoutes: ["/auth/login", "/auth/register"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const customerToken = req.cookies.get("customerToken")?.value;
  const adminToken = req.cookies.get("adminToken")?.value;

  // Check if the path is an admin route (e.g., /admin/dashboard)
  const isAdminRoute = authConfig.adminRoutes.some((route) => {
    if (route.includes(":path*")) {
      const basePath = route.split("/:path*")[0];
      return pathname.startsWith(basePath);
    }
    return false;
  });

  // Check if the path is a protected route (e.g., /dashboard)
  const isProtectedRoute = authConfig.protectedRoutes.some((route) => {
    if (route.includes(":path*")) {
      const basePath = route.split("/:path*")[0];
      return pathname.startsWith(basePath);
    }
    return pathname === route;
  });

  // Check if the path is an auth route (login/register)
  const isAuthRoute = authConfig.authRoutes.some((route) => pathname === route);

  // Verify tokens using appropriate JWT secret
  let userRole: "customer" | "admin" | undefined;
  let decodedToken: any;

  if (adminToken) {
    try {
      decodedToken = jwt.verify(adminToken, process.env.JWT_SECRET!);
      userRole = decodedToken.role === "admin" ? "admin" : undefined;
      // console.log("Middleware: Admin token verified, role =", userRole);
    } catch (err) {
      console.log("Middleware: Invalid admin token", err);
    }
  } else if (customerToken) {
    try {
      decodedToken = jwt.verify(
        customerToken,
        process.env.CUSTOMER_JWT_SECRET!
      );
      userRole = decodedToken.role === "customer" ? "customer" : undefined;
      // console.log("Middleware: Customer token verified, role =", userRole);
    } catch (err) {
      console.log("Middleware: Invalid customer token", err);
    }
  }

  // Redirect logic
  // if (!userRole) {
  //   // Not authenticated
  //   if (isAdminRoute || isProtectedRoute) {
  //     console.log("Middleware: Redirecting to /auth/login (unauthenticated)");
  //     return NextResponse.redirect(new URL("/auth/login", req.url));
  //   }
  // } else {
  //   // Authenticated
  //   // Protect admin routes for admins only
  //   if (isAdminRoute && userRole !== "admin") {
  //     console.log("Middleware: Redirecting to /auth/login (non-admin)");
  //     return NextResponse.redirect(new URL("/auth/login", req.url));
  //   }

  //   // Redirect authenticated users from auth routes
  //   if (isAuthRoute) {
  //     // Redirect based on user role
  //     const redirectUrl =
  //       userRole === "admin" ? "/admin/dashboard" : "/dashboard";
  //     console.log(`Middleware: Redirecting to ${redirectUrl}`);
  //     return NextResponse.redirect(new URL(redirectUrl, req.url));
  //   }
  // }

  // console.log("Middleware: Proceeding to next");
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
