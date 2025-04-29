"use client";
import {
  CreditCard,
  Home,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Truck,
  Users,
  FileText,
  User,
  File,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import SiteSettingsDropdown from "./SiteDropdown";
import { toast } from "sonner";

interface SideBarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  navigateToOrders: () => void;
}

const SideBar = ({
  isSidebarOpen,
  toggleSidebar,
  navigateToOrders,
}: SideBarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, admin, isLoading } = useAuth();

  const [displayEmail, setDisplayEmail] = useState(
    admin?.email || "admin@gmail.com"
  );
  const [displayImage, setDisplayImage] = useState(
    admin?.image || "/images/default-profile.png"
  );

  useEffect(() => {
    if (!isLoading && admin) {
      setDisplayEmail(admin.email);
      const imageUrl =
        admin.image && admin.image !== ""
          ? admin.image.replace(/^\/public\//, "/")
          : "/images/default-profile.png";
      setDisplayImage(imageUrl);
    } else if (!isLoading && !admin) {
      setDisplayEmail("admin@gmail.com");
      setDisplayImage("/images/default-profile.png");
    }
  }, [admin, isLoading]);

  const handleImageError = () => {
    setDisplayImage("/images/default-profile.png");
    toast.error("Failed to load profile image");
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/admin");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  const handleSetting = () => {
    router.push("/admin/dashboard/setting");
  };

  const displayRole =
    admin?.role && admin.role.length > 0
      ? admin.role.charAt(0).toUpperCase() + admin.role.slice(1)
      : "Guest";

  return (
    <div
      className={`fixed inset-y-0 z-50 hidden md:flex flex-col bg-black/20 backdrop-blur-xl border-r border-white/10 shadow-xl transition-all duration-300 ease-in-out
                ${isSidebarOpen ? "w-64" : "w-20"}`}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-purple-400" />
          <span
            className={`font-bold text-lg text-white transition-opacity duration-300 
                            ${
                              isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
                            }`}
          >
            Rudraksha Store
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="text-gray-200 hover:bg-white/10"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <Menu className="h-5 w-5 text-white/70 hover:bg-white/10 hover:text-white" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          <Link
            href="/admin/dashboard"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white transition-all hover:text-purple-400 ${
              pathname === "/admin/dashboard" ? "border border-purple-500" : ""
            }`}
          >
            <Home className="h-5 w-5" />
            <span
              className={`transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              Dashboard
            </span>
          </Link>

          <Link
            href="/admin/dashboard/orders"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
              pathname === "/admin/dashboard/orders"
                ? "border border-purple-500"
                : ""
            }`}
            onClick={(e) => {
              e.preventDefault();
              navigateToOrders();
            }}
          >
            <ShoppingCart className="h-5 w-5" />
            <span
              className={`transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              Orders
            </span>
            <Badge
              className={`${
                isSidebarOpen ? "ml-auto" : "absolute right-2"
              } bg-purple-500 hover:bg-purple-600`}
            >
              24
            </Badge>
          </Link>

          <Link
            href="/admin/dashboard/products"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
              pathname === "/admin/dashboard/products"
                ? "border border-purple-500"
                : ""
            }`}
          >
            <Package className="h-5 w-5" />
            <span
              className={`transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              Products
            </span>
          </Link>

          <Link
            href="/admin/dashboard/customers"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
              pathname === "/admin/dashboard/customers"
                ? "border border-purple-500"
                : ""
            }`}
          >
            <Users className="h-5 w-5" />
            <span
              className={`transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              Customers
            </span>
          </Link>

          <Link
            href="/admin/dashboard/category"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
              pathname === "/admin/dashboard/category"
                ? "border border-purple-500"
                : ""
            }`}
          >
            <Tag className="h-5 w-5" />
            <span
              className={`transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              Product Category
            </span>
          </Link>

          <Link
            href="/admin/dashboard/payments"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
              pathname === "/admin/dashboard/payments"
                ? "border border-purple-500"
                : ""
            }`}
          >
            <CreditCard className="h-5 w-5" />
            <span
              className={`transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              Payments
            </span>
          </Link>

          <Link
            href="/admin/dashboard/shipping"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
              pathname === "/admin/dashboard/shipping"
                ? "border border-purple-500"
                : ""
            }`}
          >
            <Truck className="h-5 w-5" />
            <span
              className={`transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              Shipping
            </span>
          </Link>

          <Link
            href="/admin/dashboard/blogcategory"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
              pathname === "/admin/dashboard/blogcategory"
                ? "border border-purple-500"
                : ""
            }`}
          >
            <File className="h-5 w-5" />
            <span
              className={`transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              Blog Category
            </span>
          </Link>

          <Link
            href="/admin/dashboard/blog"
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
              pathname === "/admin/dashboard/blog"
                ? "border border-purple-500"
                : ""
            }`}
          >
            <FileText className="h-5 w-5" />
            <span
              className={`transition-opacity duration-300 ${
                isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              Blog Post
            </span>
          </Link>

          {admin?.role === "admin" && (
            <>
              <Link
                href="/admin/dashboard/user"
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-all hover:text-purple-400 relative ${
                  pathname === "/admin/dashboard/user"
                    ? "border border-purple-500"
                    : ""
                }`}
              >
                <User className="h-5 w-5" />
                <span
                  className={`transition-opacity duration-300 ${
                    isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
                  }`}
                >
                  Users
                </span>
              </Link>

              {isSidebarOpen && <SiteSettingsDropdown />}
            </>
          )}
        </nav>
      </div>

      <div className="mt-auto border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage
              src={displayImage}
              alt={admin?.email || "Profile"}
              onError={handleImageError}
            />
            <AvatarFallback className="bg-purple-600">
              {isLoading ? "..." : admin?.email?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div
            className={`min-w-0 flex-1 transition-opacity duration-300 ${
              isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
            }`}
          >
            <p className="text-sm font-medium text-white truncate">
              {isLoading ? "Loading..." : displayEmail}
            </p>
            <p className="text-xs text-white/70">{displayRole}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto text-white/70 hover:bg-white/10 hover:text-white"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-slate-900 border border-white/10 text-white"
            >
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                onClick={handleSetting}
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="text-white/70">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="hover:bg-white/10 focus:bg-white/10 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="text-white/70">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
