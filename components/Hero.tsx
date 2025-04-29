"use client";
import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import {
  heroEnglishTexts,
  heroChineseTexts,
  heroHindiTexts,
  heroNepaliTexts,
} from "@/language";
import { motion } from "framer-motion";

export default function Hero() {
  const { selectedLanguage } = useLanguage();

  const heroTexts =
    selectedLanguage === "chinese"
      ? heroChineseTexts
      : selectedLanguage === "hindi"
      ? heroHindiTexts
      : selectedLanguage === "nepali"
      ? heroNepaliTexts
      : heroEnglishTexts;

  // Updated Framer Motion variants for the glowing border animation
  const borderVariants = {
    animate: {
      background: [
        "linear-gradient(90deg, #f5e8c7 0%, #d4af37 50%, #ffffff 100%)",
        "linear-gradient(180deg, #f5e8c7 0%, #d4af37 50%, #ffffff 100%)",
        "linear-gradient(270deg, #f5e8c7 0%, #d4af37 50%, #ffffff 100%)",
        "linear-gradient(360deg, #f5e8c7 0%, #d4af37 50%, #ffffff 100%)",
        "linear-gradient(90deg, #f5e8c7 0%, #d4af37 50%, #ffffff 100%)",
      ],
      boxShadow: [
        "0 0 10px rgba(245, 232, 199, 0.8), 0 0 20px rgba(212, 175, 55, 0.5)", // Cream to gold
        "0 0 10px rgba(212, 175, 55, 0.8), 0 0 20px rgba(255, 255, 255, 0.5)", // Gold to white
        "0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(245, 232, 199, 0.5)", // White to cream
      ],
      transition: {
        duration: 4,
        ease: "linear",
        repeat: Infinity,
        repeatType: "loop" as const,
      },
    },
  };

  return (
    <section className="flex flex-col">
      <div className="relative h-[80vh] w-full overflow-hidden z-0">
        <div className="absolute inset-0">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
          >
            <source src="/videos/videoforsite.mp4" type="video/mp4" />
            {heroTexts.videotext}
          </video>
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
          <h1
            className="animate-fade-in mb-4 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
            style={{
              background: "linear-gradient(90deg, #f5e8c7, #d4af37, #ffffff)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
              textShadow: "0 0 10px rgba(212, 175, 55, 0.6)", // Golden glow
            }}
          >
            {heroTexts.h1}
          </h1>
          <p className="animate-fade-in mb-8 max-w-2xl text-lg md:text-2xl">
            {heroTexts.h2}
          </p>
          <div className="relative">
            <motion.div
              className="absolute inset-0"
              variants={borderVariants}
              animate="animate"
              style={{
                borderRadius: "12px",
                padding: "4px",
                zIndex: -1,
              }}
            />
            <Button
              asChild
              className="p-6 text-lg animate-fade-in bg-gradient-to-r from-gray-900 to-indigo-900 text-white border-none"
            >
              <Link href="/shop">{heroTexts.h3}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
