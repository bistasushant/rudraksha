"use client";
import {
  testimonialChineseTexts,
  testimonialEnglishTexts,
  testimonialHindiTexts,
  testimonialNepaliTexts,
} from "@/language";
import { Star } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";
import { useLanguage } from "@/context/language-context";

export default function Testimonial() {
  const { selectedLanguage } = useLanguage(); // Get selectedLanguage from context

  // Define testimonials
  const [testimonials] = useState([
    {
      id: 1,
      avatar: "/images/Rajeshdai.png",
      name: "Rajesh Hamal",
      location: "Kathmandu, Nepal",
      rating: 4.5,
      review:
        "The craftsmanship of Rudraksya products is remarkable, showcasing intricate details that reflect deep cultural significance. Shopping with them fulfills spiritual needs and supports traditional artisans.",
    },
    {
      id: 2,
      avatar: "/images/Adolf-Hitler.png",
      name: "Adolf Hitler",
      location: "Braunau am Inn, Austria",
      rating: 4.5,
      review:
        "I was thoroughly impressed by the variety of authentic religious items available at Rudraksya, making it easy to find exactly what I was looking for. Their commitment to quality and authenticity shines through in every piece!",
    },
    {
      id: 3,
      avatar: "/images/JungBahadur-gr.jpg",
      name: "Jung Bahadur Rana",
      location: "Kathmandu, Nepal",
      rating: 5,
      review:
        "Rudraksya's user-friendly website and fast shipping made my shopping experience seamless and enjoyable. I highly recommend them to anyone seeking meaningful religious items that inspire and uplift the spirit.",
    },
  ]);

  // Select testimonial texts based on the selected language
  const testimonialTexts =
    selectedLanguage === "chinese"
      ? testimonialChineseTexts
      : selectedLanguage === "hindi"
      ? testimonialHindiTexts
      : selectedLanguage === "nepali"
      ? testimonialNepaliTexts
      : testimonialEnglishTexts; // Default to English

  return (
    <div>
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {testimonialTexts.h1}{" "}
            {/* Use the correct heading based on language */}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="p-6 border-2 bg-white rounded-lg shadow-md"
              >
                <div className="flex flex-col items-center justify-center">
                  <Image
                    src={testimonial.avatar}
                    alt="avatar"
                    width={100}
                    height={100}
                    className="rounded-full w-16 h-16 object-cover"
                  />
                  <p className="font-semibold mt-4">{testimonial.name}</p>
                  <p className="text-md text-gray-500">
                    {testimonial.location}
                  </p>
                </div>
                <div className="flex items-center justify-center mt-2">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      fill={
                        index < Math.round(testimonial.rating)
                          ? "currentColor"
                          : "none"
                      }
                      className="text-yellow-500 w-5 h-5"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mt-4 text-center">
                  {testimonial.review}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
