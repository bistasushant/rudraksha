"use client";
import { useLanguage } from "@/context/language-context";
import {
  benefitsEnglishTexts,
  benefitsChineseTexts,
  benefitsHindiTexts,
  benefitsNepaliTexts,
} from "@/language";
import React from "react";

export default function Benefits() {
  const { selectedLanguage } = useLanguage();

  // Map selected language to the appropriate benefits texts
  const benefitsTexts =
    selectedLanguage === "chinese"
      ? benefitsChineseTexts
      : selectedLanguage === "hindi"
      ? benefitsHindiTexts
      : selectedLanguage === "nepali"
      ? benefitsNepaliTexts
      : benefitsEnglishTexts;

  return (
    <div>
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {benefitsTexts.h1}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: benefitsTexts.h2,
                description: benefitsTexts.h3,
              },
              {
                title: benefitsTexts.h4,
                description: benefitsTexts.h5,
              },
              {
                title: benefitsTexts.h6,
                description: benefitsTexts.h7,
              },
              {
                title: benefitsTexts.h8,
                description: benefitsTexts.h9,
              },
              {
                title: benefitsTexts.h10,
                description: benefitsTexts.h11,
              },
              {
                title: benefitsTexts.h12,
                description: benefitsTexts.h13, // Concatenation using template literal
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="p-6 border-2 bg-white rounded-lg shadow-md"
              >
                <h3 className="text-2xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
