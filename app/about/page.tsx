"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
// Import HandHeart instead of Dove
import {
  Leaf,
  Target,
  History,
  Users,
  Gem,
  Heart,
  HandHeart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import Link from "next/link";
import {
  aboutEnglishTexts,
  aboutChineseTexts,
  aboutHindiTexts,
  aboutNepaliTexts,
} from "@/language";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
interface Value {
  title: string;
  description: string;
}
interface AboutDetails {
  title?: string;
  description?: string;
  imageUrl?: string;
  heroTitle?: string;
  heroDescription?: string;
  missionTitle?: string; // Although defined, seems unused based on commented code
  missionDescription?: string; // Although defined, seems unused based on commented code
  values?: Value[];
  storyTitle?: string;
  storyDescription?: string;
}
export default function About() {
  const { selectedLanguage } = useLanguage();
  const [aboutDetails, setAboutDetails] = useState<AboutDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // Fetch about details from API
    const fetchAboutDetails = async () => {
      try {
        setLoading(true);
        setError(null); // Reset error state on new fetch attempt
        const response = await fetch("/api/sitesetting/about");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch about details: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        // console.log("Fetched about details:", data); // Debug log
        if (data?.data) {
          setAboutDetails({
            // Explicitly map expected fields from API response
            title: data.data.title,
            description: data.data.description,
            imageUrl: data.data.imageUrl,
            heroTitle: data.data.heroTitle, // Assuming these exist in your API response
            heroDescription: data.data.heroDescription,
            // missionTitle: data.data.missionTitle,
            // missionDescription: data.data.missionDescription,
            values: data.data.values,
            storyTitle: data.data.storyTitle,
            storyDescription: data.data.storyDescription,
          });
        } else {
          console.warn("No about details data found in API response structure");
          setAboutDetails({}); // Set to empty object to trigger fallbacks
        }
      } catch (err) {
        console.error("Error fetching about details:", err);
        setError((err as Error).message || "Failed to fetch about details");
        setAboutDetails({}); // Set to empty object on error to trigger fallbacks
      } finally {
        setLoading(false);
      }
    };
    fetchAboutDetails();
  }, []); // Empty dependency array ensures this runs once on mount
  const aboutTexts =
    selectedLanguage === "chinese"
      ? aboutChineseTexts
      : selectedLanguage === "hindi"
      ? aboutHindiTexts
      : selectedLanguage === "nepali"
      ? aboutNepaliTexts
      : aboutEnglishTexts;
  // Fallback logic using optional chaining and nullish coalescing
  const heroTitle = aboutDetails?.heroTitle || aboutTexts.h1;
  const heroDescription = aboutDetails?.heroDescription || aboutTexts.h2;
  const title = aboutDetails?.title || aboutTexts.h1; // Assuming mission title fallback is h1 if not specified
  const description = aboutDetails?.description || aboutTexts.h2; // Assuming mission desc fallback is h2 if not specified
  const values =
    aboutDetails?.values && aboutDetails.values.length > 0
      ? aboutDetails.values
      : [
          { title: aboutTexts.authenticity, description: aboutTexts.h7 },
          { title: aboutTexts.integrity, description: aboutTexts.h8 },
          { title: aboutTexts.community, description: aboutTexts.h9 },
          { title: aboutTexts.spirituality, description: aboutTexts.h14 },
          { title: aboutTexts.customerCentricity, description: aboutTexts.h15 },
          { title: aboutTexts.sustainability, description: aboutTexts.h16 },
        ];
  const storyTitle = aboutDetails?.storyTitle || aboutTexts.h10;
  // Split storyDescription into paragraphs or use fallback
  const storyParagraphs = aboutDetails?.storyDescription
    ? aboutDetails.storyDescription.split("\n").filter((p) => p.trim())
    : [aboutTexts.h11, aboutTexts.h12, aboutTexts.h13]; // Fallback paragraphs
  const imageUrl = aboutDetails?.imageUrl
    ? aboutDetails.imageUrl // Assuming API provides full URL or correct relative path
    : "/images/mission-image.png"; // Default fallback image
  return (
    <>
      <Header />
      <section className="flex flex-col">
        {/* Hero Section */}
        <div className="relative h-[60vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/spiritual.png" // Consider making this dynamic if needed
              alt={heroTitle || "Hero Image"} // Add fallback alt text
              fill
              priority // Load this image early
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-black/40" /> {/* Overlay */}
          </div>
          <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
            {loading ? (
              <p className="text-lg">Loading...</p> // Use a spinner component if available
            ) : error ? (
              <div className="space-y-4">
                <p className="text-red-300">Error loading content: {error}</p>
                <Button
                  onClick={() => window.location.reload()} // Simple retry by reloading
                  className="bg-primary hover:bg-primary/90"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
                  {heroTitle}
                </h1>
                <p className="mb-8 max-w-2xl text-lg md:text-xl">
                  {heroDescription}
                </p>
              </>
            )}
          </div>
        </div>
        {/* Mission Section - Render only if not loading and no error */}
        {!loading && !error && (
          <div className="bg-gray-50 py-16">
            <div className="container mx-auto px-4">
              <div className="grid items-center gap-12 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    {/* Icon related to mission/company purpose - Leaf might be sustainability? */}
                    <Leaf className="h-8 w-8 text-primary" />
                    <h2 className="text-3xl font-bold">{title}</h2>
                  </div>
                  <p className="text-lg text-gray-600">{description}</p>
                  <Button asChild className="bg-primary hover:bg-primary/90">
                    <Link href="/shop">{aboutTexts.h5}</Link>
                  </Button>
                </div>
                <div className="relative h-64 md:h-96 rounded-lg overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={title || "Mission Image"} // Fallback alt text
                    fill
                    // Consider adding sizes attribute for optimization
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Values Section - Render only if not loading and no error */}
        {!loading && !error && (
          <div className="py-16">
            <div className="container mx-auto px-4">
              <h2 className="mb-12 text-center text-3xl font-bold">
                {aboutTexts.h6} {/* Values Title */}
              </h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {values.map((value, index) => (
                  <div
                    key={value.title || index} // Prefer unique title if available, fallback to index
                    className="flex flex-col items-center p-6 bg-white rounded-lg shadow-md text-center hover:shadow-lg transition-shadow"
                  >
                    {/* Conditionally render icons based on index */}
                    {index === 0 && (
                      <Gem className="h-12 w-12 text-primary mb-4" />
                    )}
                    {index === 1 && (
                      <Target className="h-12 w-12 text-primary mb-4" />
                    )}
                    {index === 2 && (
                      <Users className="h-12 w-12 text-primary mb-4" />
                    )}
                    {index === 3 && (
                      // Icon for Spirituality - Replaced Dove with HandHeart
                      <HandHeart className="h-12 w-12 text-primary mb-4" />
                    )}
                    {index === 4 && (
                      // Icon for Customer Centricity
                      <Heart className="h-12 w-12 text-primary mb-4" />
                    )}
                    {index === 5 && (
                      // Icon for Sustainability
                      <Leaf className="h-12 w-12 text-primary mb-4" />
                    )}
                    {/* Add a default icon or handle cases where index > 5 if values array can grow */}
                    {index > 5 && (
                      <Gem className="h-12 w-12 text-gray-400 mb-4" /> // Example fallback icon
                    )}
                    <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Story Section - Render only if not loading and no error */}
        {!loading && !error && (
          <div className="bg-gray-50 py-16">
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-4 mb-8 md:mb-12 justify-center md:justify-start">
                <History className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold">{storyTitle}</h2>
              </div>
              <div className="grid items-center gap-8 md:grid-cols-2">
                {/* Text content appears first on mobile, second on md+ */}
                <div className="space-y-4 md:order-2">
                  {storyParagraphs.map((paragraph, index) => (
                    <p key={index} className="text-lg text-gray-700">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {/* Image appears second on mobile, first on md+ */}
                <div className="relative h-80 md:h-96 rounded-lg overflow-hidden md:order-1">
                  <Image
                    src="/images/Story-of-Rudraksha.jpg" // Consider making dynamic if needed
                    alt={storyTitle || "Story Image"} // Fallback alt text
                    fill
                    className="object-cover"
                    // Consider adding sizes attribute
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      <Footer />
    </>
  );
}
