"use client";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  footerEnglishTexts,
  footerChineseTexts,
  footerHindiTexts,
  footerNepaliTexts,
} from "@/language";

import {
  Leaf,
  Facebook,
  Instagram,
  TwitterIcon,
  YoutubeIcon,
  Mail,
} from "lucide-react";

const Footer = () => {
  const { selectedLanguage } = useLanguage(); // Get selectedLanguage from context
  const footerTexts =
    selectedLanguage === "chinese"
      ? footerChineseTexts
      : selectedLanguage === "hindi"
      ? footerHindiTexts
      : selectedLanguage === "nepali"
      ? footerNepaliTexts
      : footerEnglishTexts;

  // Define navFooter and services directly in render, no useState needed
  const navFooter = [
    { id: 1, name: footerTexts.home },
    { id: 2, name: footerTexts.shop },
    { id: 3, name: footerTexts.about },
    { id: 4, name: footerTexts.blog },
    { id: 5, name: footerTexts.contact },
  ];

  const services = [
    { id: 1, name: footerTexts.shippingpolicy },
    { id: 2, name: footerTexts.returnrefunds },
    { id: 3, name: footerTexts.Faqs },
    { id: 4, name: footerTexts.privacypolicy },
    { id: 5, name: footerTexts.termsconditon },
  ];

  const logos = [
    { id: 1, social: <Facebook /> },
    { id: 2, social: <Instagram /> },
    { id: 3, social: <TwitterIcon /> },
    { id: 4, social: <YoutubeIcon /> },
  ];

  return (
    <footer className="bg-gray-900 font-bold text-white py-4">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand and Description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <Leaf className="h-6 w-6 text-white" />
              <span className="ml-2 text-2xl font-bold tracking-wider text-white">
                {footerTexts.rudraksha}
              </span>
            </Link>
            <p className="text-sm text-white max-w-xs">{footerTexts.h1}</p>
            <div className="flex flex-row space-x-4">
              {logos.map((logo) => (
                <Link
                  key={logo.id}
                  href="/"
                  className="hover:text-green-500 transition-colors"
                >
                  {logo.social}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 hover:text-green-500 transition-colors cursor-pointer">
              {footerTexts.h2}
            </h3>
            <ul className="space-y-2">
              {navFooter.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/"
                    className="text-white hover:text-gray-600 transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-4 hover:text-green-500 transition-colors cursor-pointer">
              {footerTexts.customerservice}
            </h3>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service.id}>
                  <Link
                    href="/"
                    className="text-white hover:text-gray-600 transition-colors text-sm"
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Section */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white mb-2 hover:text-green-500 transition-colors cursor-pointer">
              {footerTexts.h3}
            </h3>
            <p className="text-sm text-gray-400 mb-3">{footerTexts.h4}</p>
            <div className="flex space-x-2">
              <div className="relative flex-grow max-w-xs">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  type="email"
                  placeholder={footerTexts.yourEmail}
                  className="pl-10 py-2 text-sm w-full border rounded-md bg-gray-800 text-white"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="py-2 px-4 bg-white hover:bg-green-600 hover:text-white transition-colors cursor-pointer text-gray-900 rounded-md"
              >
                {footerTexts.subscribe}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="mt-12 border-t border-gray-700 pt-8 text-center text-sm text-gray-400">
        <p>
          © {new Date().getFullYear()} {footerTexts.copyright}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
