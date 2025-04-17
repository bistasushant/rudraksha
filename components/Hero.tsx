// components/Hero.tsx
"use client";
import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { useLanguage } from "@/context/language-context"; // Import the useLanguage hook
import {
  heroEnglishTexts,
  heroChineseTexts,
  heroHindiTexts,
  heroNepaliTexts,
} from "@/language"; // Import your language data

export default function Hero() {
  const { selectedLanguage } = useLanguage(); // Get selectedLanguage from context

  // Choose the correct language object based on selected language
  const heroTexts =
    selectedLanguage === "chinese"
      ? heroChineseTexts
      : selectedLanguage === "hindi"
      ? heroHindiTexts
      : selectedLanguage === "nepali"
      ? heroNepaliTexts
      : heroEnglishTexts;

  return (
    <section className="flex flex-col">
      {/* Hero Section */}
      <div className="relative h-[80vh] w-full overflow-hidden z-0">
        <div className="absolute inset-0">
          {/* Adding the video to the hero section */}
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
          >
            <source src="/videos/videoforsite.mp4" type="video/mp4" />
            {heroTexts.videotext}
          </video>
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <h1 className="animate-fade-in mb-4 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            {heroTexts.h1}
          </h1>
          <p className="animate-fade-in mb-8 max-w-2xl text-lg md:text-2xl">
            {heroTexts.h2}
          </p>
          <Button
            asChild
            className="p-6 text-lg animate-fade-in bg-primary hover:bg-primary/90 text-white"
          >
            <Link href="/user/shop">{heroTexts.h3}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
