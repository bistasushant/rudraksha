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
import React, { useEffect, useState, useRef } from "react";
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
  const [siteTitle, setSiteTitle] = useState("");

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

    const fetchLogo = async () => {
      try {
        const response = await fetch("/api/sitesetting/logo");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch logo: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        const logo = data?.data?.url || data?.url || "/api/sitesetting/logo";
        setLogoUrl(logo);
      } catch (err) {
        console.error("Error fetching logo:", err);
        setLogoUrl(null);
      }
    };

    const fetchTitle = async () => {
      try {
        const response = await fetch("/api/sitesetting/title");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch title: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        const title =
          data?.data?.title || data?.data?.name || data?.data?.siteTitle || "";
        setSiteTitle(title);
      } catch (err) {
        console.error("Error fetching title:", err);
        setSiteTitle("");
      }
    };

    fetchLogo();
    fetchTitle();
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
    { id: 2, name: texts.shop, href: "/user/shop" },
    { id: 3, name: texts.about, href: "/user/about" },
    { id: 4, name: texts.blog, href: "/user/blog" },
    { id: 5, name: texts.contact, href: "/user/contact" },
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
    toast.success("Logout");
    window.location.href = "/";
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language as LanguageKey);
    setIsDropdownOpen(false);
  };

  const navigateToAdminDashboard = () => {
    setUserDropdownOpen(false);
    router.push("/admin");
  };

  const isAdminUser =
    userRole && ["admin", "editor", "user"].includes(userRole);
  const displayTitle = siteTitle || (mounted ? texts.rudraksha : "Rudraksha");

  return (
    <>
      <header
        className={`w-full fixed top-0 z-50 transition-all duration-300 bg-[#1A2526] ${
          isScrolled ? "py-2 shadow-md" : "py-4 shadow-sm"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center group">
              <div className="relative p-2 transition-transform group-hover:scale-105">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={displayTitle}
                    fill
                    className="object-contain rounded-lg"
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
              <span className="ml-3 hidden md:block text-3xl font-bold font-poppins tracking-wider text-gray-200 transition-colors group-hover:text-white">
                {displayTitle}
              </span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  href={link.href}
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
                    <div className="absolute right-0 mt-2 w-56 bg-[#1A2526] border border-gray-600 rounded-lg shadow-lg z-50 transition-all duration-200 animate-fadeIn">
                      <div className="p-4 text-lg font-semibold font-poppins text-gray-200 border-b border-gray-600">
                        Account Options
                      </div>
                      <div className="flex flex-col">
                        <Link
                          href="/user/profile"
                          className="flex items-center gap-2 p-4 hover:bg-gray-700 hover:text-white transition-colors text-base font-poppins text-gray-200"
                        >
                          Profile
                        </Link>

                        {isAdminUser && (
                          <button
                            onClick={navigateToAdminDashboard}
                            className="flex items-center gap-2 p-4 text-left hover:bg-gray-700 hover:text-white transition-colors text-base font-poppins text-amber-600 font-medium"
                          >
                            <LayoutDashboard className="h-4 w-4 stroke-2 text-gray-200" />
                            Admin Login
                          </button>
                        )}

                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="flex items-center gap-2 p-4 text-left hover:bg-gray-700 hover:text-white transition-colors text-base font-poppins text-red-600 disabled:opacity-50"
                        >
                          {isLoggingOut ? (
                            <svg
                              className="animate-spin h-4 w-4 text-red-600"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
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
                            <LogOut className="h-4 w-4 stroke-2 text-gray-200" />
                          )}
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/auth/login"
                    className="text-lg font-medium font-poppins text-gray-200 hover:text-white transition-colors"
                  >
                    {texts.signin}
                  </Link>
                </div>
              )}

              <div className="relative" ref={miniCartRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full relative group hover:bg-gray-700 cart-icon p-4"
                  onClick={() => setMiniCartOpen(!miniCartOpen)}
                  aria-label={`Cart with ${totalItemsInCart} items`}
                >
                  <ShoppingCart className="size-5 text-gray-200 group-hover:text-white stroke-2" />
                  {totalItemsInCart > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-medium rounded-full px-2 py-0.5 animate-pulse">
                      {totalItemsInCart}
                    </span>
                  )}
                </Button>
                {miniCartOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#1A2526] border border-gray-600 rounded-lg shadow-lg z-50 transition-all duration-200 animate-fadeIn">
                    <div className="p-4 text-lg font-semibold font-poppins text-gray-200 border-b border-gray-600">
                      Your Cart
                    </div>
                    <div className="p-4">
                      {cartItems.length > 0 ? (
                        <ul className="space-y-2">
                          {cartItems.map((item) => (
                            <li
                              key={item.id}
                              className="flex justify-between text-base font-poppins text-gray-200"
                            >
                              <span>{item.name}</span>
                              <span>x{item.quantity}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-base font-poppins text-gray-200">
                          Your cart is empty
                        </p>
                      )}
                    </div>
                    <div className="p-4 border-t border-gray-600">
                      <Link
                        href="/user/cart"
                        className="block text-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 hover:text-white hover:shadow-md transition-all duration-200 font-poppins text-base"
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
                  className="rounded-full hover:bg-gray-700 p-4"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  aria-label="Change language"
                  aria-expanded={isDropdownOpen}
                >
                  <Globe className="size-5 text-gray-200 hover:text-white stroke-2" />
                </Button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#1A2526] border border-gray-600 rounded-lg shadow-lg z-50 transition-all duration-200 animate-fadeIn">
                    <div className="p-4 text-lg font-semibold font-poppins text-gray-200">
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
                          className={`flex items-center justify-between gap-3 p-2 hover:bg-gray-700 hover:text-white rounded-md text-base font-poppins text-gray-200 ${
                            selectedLanguage === lang
                              ? "border border-amber-500"
                              : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Image
                              src={flag}
                              alt={label}
                              width={24}
                              height={16}
                              className="w-6 h-4"
                            />
                            {label}
                          </div>
                          {selectedLanguage === lang && (
                            <Check className="h-4 w-4 text-amber-500 stroke-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4 md:hidden">
              <Link href="/user/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full group hover:bg-gray-700 cart-icon p-4"
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
                    className="rounded-full hover:bg-gray-700 p-4"
                    aria-label="Open mobile menu"
                  >
                    <Menu className="h-9 w-9 text-gray-200 stroke-2" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-[300px] sm:w-[400px] p-4 bg-[#1A2526]"
                >
                  <SheetTitle className="sr-only">
                    Mobile Navigation Menu
                  </SheetTitle>
                  <nav className="flex flex-col space-y-4 mt-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.id}
                        href={link.href}
                        className="text-xl font-medium font-poppins uppercase text-gray-200 hover:text-white transition-colors"
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
                            className="text-base font-medium text-purple-600 transition-colors text-left cursor-pointer"
                          >
                            Admin Dashboard
                          </button>
                        )}

                        <button
                          onClick={handleLogout}
                          className="text-base font-medium text-red-600 transition-colors hover:text-red-700 text-left"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/user/auth/login"
                        className="text-base font-medium transition-colors hover:text-primary"
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
