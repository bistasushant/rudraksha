"use client";
import {
  Check,
  Globe,
  Menu,
  ShoppingCart,
  User,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState, useRef, startTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/context/cart-context";
import { LanguageKey, useLanguage } from "@/context/language-context";
import Image from "next/image";
import {
  headerEnglishTexts,
  headerChineseTexts,
  headerHindiTexts,
  headerNepaliTexts,
} from "@/language";
import { toast, Toaster } from "sonner";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [username, setUsername] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  // const [siteTitle, setSiteTitle] = useState<string>("");

  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const lastScrollY = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const miniCartRef = useRef<HTMLDivElement>(null);
  const prevCartCount = useRef(0);

  const pathname = usePathname();
  const router = useRouter();
  const { cartItems } = useCart();

  useEffect(() => {
    setMounted(true);
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    const authToken = localStorage.getItem("authToken");

    if (authToken && !token) {
      localStorage.setItem("token", authToken);
    } else if (token && !authToken) {
      localStorage.setItem("authToken", token);
    }

    if (storedUsername) setUsername(storedUsername);
    if (storedRole) setUserRole(storedRole);

    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/sitesetting/setting", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch settings: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        // Set logo URL
        const logo = data?.data?.logo?.url || null;
        setLogoUrl(logo);
        // Set site title
        // const title = data?.data?.title?.title || "";
        // setSiteTitle(title);
      } catch (err) {
        console.error("Error fetching settings:", err);
        setLogoUrl(null);
        // setSiteTitle("");
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
      if (
        miniCartRef.current &&
        !miniCartRef.current.contains(event.target as Node)
      ) {
        setMiniCartOpen(false);
      }
    };

    if (isDropdownOpen || userDropdownOpen || miniCartOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen, userDropdownOpen, miniCartOpen]);

  const languageMap = {
    english: headerEnglishTexts,
    chinese: headerChineseTexts,
    hindi: headerHindiTexts,
    nepali: headerNepaliTexts,
  };

  const texts = mounted ? languageMap[selectedLanguage] : headerEnglishTexts;

  const navLinks = [
    { id: 1, name: texts.home, href: "/" },
    { id: 2, name: texts.shop, href: "/shop" },
    { id: 3, name: texts.about, href: "/about" },
    { id: 4, name: texts.blog, href: "/blog" },
    { id: 5, name: texts.contact, href: "/contact" },
  ];

  const totalItemsInCart = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  useEffect(() => {
    if (totalItemsInCart > prevCartCount.current) {
      const cartIcon = document.querySelector(".cart-icon");
      if (cartIcon) {
        cartIcon.classList.add("animate-bounce");
        setTimeout(() => cartIcon.classList.remove("animate-bounce"), 500);
      }
    }
    prevCartCount.current = totalItemsInCart;
  }, [totalItemsInCart]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("accountType");
    setUsername("");
    setUserRole(null);
    setIsLoggingOut(false);
    toast.success("Logged out successfully");
    window.location.href = "/";
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language as LanguageKey);
    setIsDropdownOpen(false);
  };

  const navigateToAdminDashboard = () => {
    setUserDropdownOpen(false);
    startTransition(() => router.push("/admin"));
  };

  const handleNavigation = (href: string) => {
    startTransition(() => router.push(href));
  };

  const isAdminUser =
    userRole && ["admin", "editor", "user"].includes(userRole);
  // const displayTitle = siteTitle || (mounted ? texts.rudraksha : "Rudraksha");

  return (
    <>
      <header
        className={`w-full fixed top-0 z-50 transition-all duration-300 bg-gradient-to-r from-gray-900 to-indigo-900 text-white py-8" ${
          isScrolled ? "py-2 shadow-md" : "py-2 shadow-sm"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center group">
              <div className="relative flex items-center transition-transform group-hover:scale-105">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt="logo"
                    width={70}
                    height={70}
                    className="object-contain rounded-md"
                    priority
                    onError={() => setLogoUrl(null)}
                  />
                ) : (
                  <svg
                    className="h-12 w-12 text-gray-200 group-hover:text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <path d="M12 6v12M6 12h12" strokeWidth="2" />
                  </svg>
                )}
              </div>
              {/* <span className="ml-2 hidden md:block text-3xl font-bold font-poppins tracking-wider text-gray-200 transition-colors group-hover:text-white">
                {displayTitle}
              </span> */}
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
                  prefetch={true}
                  onClick={() => handleNavigation(link.href)}
                  className={`relative text-lg font-medium font-poppins uppercase text-gray-200 transition-colors hover:text-white ${
                    pathname === link.href ? "text-amber-600" : ""
                  } after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-amber-600 after:scale-x-0 after:transition-transform after:origin-left hover:after:scale-x-100 ${
                    pathname === link.href ? "after:scale-x-100" : ""
                  }`}
                  aria-current={pathname === link.href ? "page" : undefined}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-6">
              {username ? (
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 text-lg font-medium font-poppins text-gray-200 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-lg px-2 py-1"
                    aria-label="User menu"
                    aria-expanded={userDropdownOpen}
                  >
                    <User className="h-5 w-5 stroke-2 text-gray-200 hover:text-white" />
                    <span>{username}</span>
                    <svg
                      className="w-4 h-4 fill-current text-gray-200 group-hover:fill-white"
                      viewBox="0 0 20 20"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-gradient-to-b from-gray-800 to-indigo-950 border border-indigo-700 rounded-lg shadow-xl z-50 motion-safe:animate-fadeIn motion-safe:animate-slideDown motion-reduce:animate-none origin-top-right overflow-hidden" // Added animation and origin
                      role="menu" // Accessibility: Role for the dropdown container
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button" // Assuming the button above has id="user-menu-button" - add it if needed
                    >
                      <div className="p-4 bg-indigo-900/40 border-b border-indigo-700">
                        Account Options
                      </div>
                      <div className="flex flex-col divide-y divide-gray-700">
                        <Link
                          href="/profile"
                          role="menuitem"
                          onClick={() => setUserDropdownOpen(false)}
                          className={`flex items-center gap-3 p-4 hover:bg-indigo-800/30 motion-safe:transition-colors text-base font-poppins ${
                            pathname === "/profile"
                              ? "bg-indigo-800/50 text-white"
                              : "text-gray-200"
                          } focus-visible:outline-none focus-visible:bg-indigo-800/40 focus-visible:text-white w-full text-left`}
                        >
                          <User
                            className={`h-5 w-5 stroke-2 ${
                              pathname === "/profile"
                                ? "text-white"
                                : "text-gray-300"
                            }`}
                          />
                          <span>Profile</span>
                        </Link>

                        {isAdminUser && (
                          <button
                            onClick={navigateToAdminDashboard}
                            className="flex items-center gap-3 p-4 text-left hover:bg-indigo-800/30 motion-safe:transition-colors text-base font-poppins text-amber-500 font-medium focus-visible:outline-none focus-visible:bg-indigo-800/40 focus-visible:text-amber-300 w-full"
                          >
                            <LayoutDashboard className="h-5 w-5 stroke-2 text-amber-400" />
                            Admin Login
                          </button>
                        )}

                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="flex items-center gap-3 p-4 text-left hover:bg-red-900/20 motion-safe:transition-colors text-base font-poppins text-red-400 disabled:opacity-50 focus-visible:outline-none focus-visible:bg-red-900/30 focus-visible:text-red-300 w-full"
                        >
                          {isLoggingOut ? (
                            <svg /* Spinner */
                              className="motion-safe:animate-spin h-5 w-5 text-red-400"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                              />
                            </svg>
                          ) : (
                            <LogOut className="h-5 w-5 stroke-2 text-red-300" />
                          )}
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className="text-base lg:text-lg font-medium font-poppins text-gray-200 hover:text-white motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded-md px-3 py-2 min-h-[48px] flex items-center" // Ensured min size
                  >
                    {texts.signin}
                  </Link>
                </div>
              )}

              <div className="relative" ref={miniCartRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full relative group hover:bg-gray-700 cart-icon-desktop p-3 min-h-[48px] min-w-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900" // Ensured size and focus style
                  onClick={() => setMiniCartOpen(!miniCartOpen)}
                  aria-label={`Cart with ${totalItemsInCart} items`}
                  aria-expanded={miniCartOpen}
                  aria-haspopup="true"
                >
                  <ShoppingCart className="size-5 text-gray-200 group-hover:text-white stroke-2" />
                  {totalItemsInCart > 0 && (
                    <span className="absolute -top-1 -right-1 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 motion-safe:animate-pulse motion-reduce:animate-none">
                      {totalItemsInCart}
                    </span>
                  )}
                </Button>
                {miniCartOpen && (
                  <div
                    className="absolute right-0 mt-2 w-80 bg-gradient-to-b from-gray-800 to-indigo-950 border border-indigo-700 rounded-lg shadow-xl z-50 motion-safe:animate-fadeIn motion-safe:animate-slideDown motion-reduce:animate-none origin-top-right" // Added animation and origin
                    aria-modal="true" // It traps focus conceptually
                    aria-label="Mini Cart Preview"
                  >
                    <div className="p-4 text-lg font-semibold font-poppins text-gray-200 border-b border-gray-600 flex justify-between items-center">
                      <span>Your Cart</span>
                      <button
                        onClick={() => setMiniCartOpen(false)}
                        className="p-1 rounded-full hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        aria-label="Close mini cart"
                      >
                        <svg
                          className="w-5 h-5 text-gray-300"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                      {cartItems.length > 0 ? (
                        <ul className="space-y-2">
                          {cartItems.map((item) => (
                            <li
                              key={item.id}
                              className="flex justify-between items-center text-sm font-poppins text-gray-200 motion-safe:transition-opacity" // Base style
                            >
                              <span className="truncate max-w-[70%] pr-2">
                                {item.name}
                              </span>
                              <span className="font-medium">
                                x{item.quantity}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-base font-poppins text-gray-400 text-center py-4">
                          Your cart is empty
                        </p>
                      )}
                    </div>
                    <div className="p-4 border-t border-gray-600">
                      <Link
                        href="/cart"
                        onClick={() => setMiniCartOpen(false)} // Close on click
                        className="block text-center w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 hover:shadow-md motion-safe:transition-all duration-200 font-poppins text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                      >
                        View Cart
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-700 p-3 min-h-[48px] min-w-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900" // Ensured size and focus style
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-label="Change language"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  <Globe className="size-5 text-gray-200 group-hover:text-white stroke-2" />
                </Button>
                {isDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-gradient-to-b from-gray-800 to-indigo-950 border border-indigo-700 rounded-lg shadow-xl z-50 motion-safe:animate-fadeIn motion-safe:animate-slideDown motion-reduce:animate-none origin-top-right overflow-hidden" // Added animation and origin
                    aria-orientation="vertical"
                    aria-label="Language Menu"
                  >
                    <div className="p-4 text-lg font-semibold font-poppins text-gray-200 border-b border-gray-600">
                      Change Language
                    </div>
                    <div className="flex flex-col p-1 gap-1">
                      {[
                        {
                          lang: "english",
                          flag: "/images/usa.png",
                          label: "English",
                        },
                        {
                          lang: "chinese",
                          flag: "/images/china.png",
                          label: "Chinese",
                        },
                        {
                          lang: "hindi",
                          flag: "/images/india.png",
                          label: "Hindi",
                        },
                        {
                          lang: "nepali",
                          flag: "/images/nepal.png",
                          label: "Nepali",
                        },
                      ].map(({ lang, flag, label }) => (
                        <button
                          key={lang}
                          onClick={() => handleLanguageChange(lang)}
                          className={`flex items-center justify-between gap-3 p-3 w-full text-left hover:bg-gray-700/80 hover:text-white rounded-md text-base font-poppins text-gray-200 motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:bg-gray-700/90 ${
                            selectedLanguage === lang
                              ? "bg-gray-700/50 font-semibold"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Image
                              src={flag}
                              alt={label}
                              width={24}
                              height={16}
                              className="w-6 h-4 object-cover rounded-sm"
                            />
                            {label}
                          </div>
                          {selectedLanguage === lang && (
                            <Check
                              className="h-4 w-4 text-amber-500 stroke-2"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4 md:hidden">
              <Link href="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full group hover:bg-gray-700 cart-icon p-4 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  aria-label={`Cart with ${totalItemsInCart} items`}
                >
                  <ShoppingCart className="h-9 w-9 text-gray-200 group-hover:text-white stroke-2" />
                  {totalItemsInCart > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-medium rounded-full px-2 py-0.5 animate-pulse">
                      {totalItemsInCart}
                    </span>
                  )}
                </Button>
              </Link>
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-gray-700 p-4 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    aria-label="Open mobile menu"
                  >
                    <Menu className="h-9 w-9 text-gray-200 stroke-2" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[300px] sm:w-[400px] p-4 bg-gradient-to-b from-gray-800 to-indigo-950 border border-indigo-700 "
                >
                  {/* bg-gradient-to-b from-gray-800 to-indigo-950 border border-indigo-700  */}

                  <SheetTitle className="sr-only">
                    Mobile Navigation Menu
                  </SheetTitle>
                  <nav className="flex flex-col space-y-4 mt-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.id}
                        href={link.href}
                        prefetch={true}
                        onClick={() => handleNavigation(link.href)}
                        className="text-xl font-medium font-poppins uppercase text-gray-200 hover:text-white transition-colors focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        aria-current={
                          pathname === link.href ? "page" : undefined
                        }
                      >
                        {link.name}
                      </Link>
                    ))}
                    {username ? (
                      <>
                        <div className="text-base font-medium border-t border-gray-200 pt-4">
                          Signed in as{" "}
                          <span className="font-bold">{username}</span>
                        </div>
                        {isAdminUser && (
                          <button
                            onClick={navigateToAdminDashboard}
                            className="text-base font-medium text-purple-600 transition-colors text-left cursor-pointer focus:ring-2 focus:ring-amber-500 focus:outline-none"
                          >
                            Admin Dashboard
                          </button>
                        )}
                        <button
                          onClick={handleLogout}
                          className="text-base font-medium text-red-600 transition-colors hover:text-red-700 text-left focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/auth/login"
                        className="text-base font-medium transition-colors hover:text-primary focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        {texts.signin}
                      </Link>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>
      <Toaster position="bottom-right" />
    </>
  );
}
