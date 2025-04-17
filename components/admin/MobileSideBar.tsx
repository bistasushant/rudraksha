"use client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import {
  CreditCard,
  FileText,
  Home,
  Menu,
  Package,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Truck,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { useEffect, useState } from "react";

interface MobileSideBarProps {
  navigateToOrders?: () => void;
}

const MobileSideBar = ({ navigateToOrders }: MobileSideBarProps = {}) => {
  const pathname = usePathname();
  const { admin, isLoading } = useAuth();

  const [displayImage, setDisplayImage] = useState(
    admin?.image || "/images/default-profile.png"
  );

  useEffect(() => {
    if (!isLoading && admin) {
      setDisplayImage(admin.image || "/images/default-profile.png");
    } else if (!isLoading && !admin) {
      setDisplayImage("/images/default-profile.png");
    }
  }, [admin, isLoading]);

  const handleOrdersClick = (e: React.MouseEvent) => {
    if (navigateToOrders) {
      e.preventDefault();
      navigateToOrders();
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden fixed top-4 left-4 z-40 text-white hover:bg-white/10"
          aria-label="Open mobile menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="bg-slate-900/95 backdrop-blur-xl border-white/10 text-white p-0"
      >
        <SheetHeader>
          <div className="flex h-16 items-center px-6 border-b border-white/10">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6 text-purple-400" />
              <span className="font-bold text-lg">SushantStore</span>
            </Link>
          </div>
        </SheetHeader>
        <SheetTitle />
        <SheetDescription />

        <nav className="grid gap-1 p-4 -mt-16">
          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white transition-all hover:text-purple-400 ${
              pathname === "/" ? "bg-white/10" : "text-white/70"
            }`}
          >
            <Home className="h-5 w-5" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/admin/dashboard/orders"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-purple-400 ${
              pathname === "/orders"
                ? "bg-white/10 text-white"
                : "text-white/70"
            }`}
            onClick={handleOrdersClick}
          >
            <ShoppingCart className="h-5 w-5" />
            <span>Orders</span>
            <Badge className="ml-auto bg-purple-500 hover:bg-purple-600">
              24
            </Badge>
          </Link>

          <Link
            href="/admin/dashboard/products"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard/products"
                ? "bg-white/10 text-white"
                : "text-white/70"
            }`}
          >
            <Package className="h-5 w-5" />
            <span>Products</span>
          </Link>

          <Link
            href="/admin/dashboard/customers"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard/customers"
                ? "bg-white/10 text-white"
                : "text-white/70"
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Customers</span>
          </Link>

          <Link
            href="/admin/dashboard/category"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard/analytics"
                ? "bg-white/10 text-white"
                : "text-white/70"
            }`}
          >
            <Tag className="h-5 w-5" />
            <span>Category</span>
          </Link>

          <Link
            href="/admin/dashboard/payments"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard/payments"
                ? "bg-white/10 text-white"
                : "text-white/70"
            }`}
          >
            <CreditCard className="h-5 w-5" />
            <span>Payments</span>
          </Link>

          <Link
            href="/admin/dashboard/shipping"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard/shipping"
                ? "bg-white/10 text-white"
                : "text-white/70"
            }`}
          >
            <Truck className="h-5 w-5" />
            <span>Shipping</span>
          </Link>
          {admin?.role === "admin" && (
            <Link
              href="/admin/dashboard/user"
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-purple-400 ${
                pathname === "/admin/dashboard/user"
                  ? "bg-white/10 text-white"
                  : "text-white/70"
              }`}
            >
              <User className="h-5 w-5" />
              <span>Users</span>
            </Link>
          )}
          <Link
            href="/admin/dashboard/blog"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard/blog"
                ? "bg-white/10 text-white"
                : "text-white/70"
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>Blog Post</span>
          </Link>
        </nav>

        <div className="mt-auto border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={displayImage} alt={admin?.name || "Profile"} />
              <AvatarFallback className="bg-purple-600">
                {isLoading ? "..." : admin?.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {isLoading ? "Loading..." : admin?.name || "Guest"}
              </p>
              <p className="text-xs text-white/70">Admin</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSideBar;
