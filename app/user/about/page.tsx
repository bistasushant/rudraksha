"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Leaf, Target, History, Users, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import Link from "next/link";

import {
  aboutEnglishTexts,
  aboutChineseTexts,
  aboutHindiTexts,
  aboutNepaliTexts,
} from "@/language";

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
  missionTitle?: string;
  missionDescription?: string;
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
        const response = await fetch("/api/sitesetting/about");
        if (!response.ok) {
          throw new Error(
            `Failed to fetch about details: ${response.statusText}`
          );
        }
        const data = await response.json();
        console.log(data);
        console.log("Fetched about details:", data); // Debug log
        if (data?.data) {
          setAboutDetails({
            title: data.data.title,
            description: data.data.description,
            imageUrl: data.data.imageUrl,
          });
        } else {
          console.warn("No about details found in API response");
          setAboutDetails({});
        }
      } catch (err) {
        console.error("Error fetching about details:", err);
        setError((err as Error).message || "Failed to fetch about details");
        setAboutDetails({});
      } finally {
        setLoading(false);
      }
    };

    fetchAboutDetails();
  }, []);

  const aboutTexts =
    selectedLanguage === "chinese"
      ? aboutChineseTexts
      : selectedLanguage === "hindi"
      ? aboutHindiTexts
      : selectedLanguage === "nepali"
      ? aboutNepaliTexts
      : aboutEnglishTexts;

  // Fallback to aboutTexts if API data is missing
  const heroTitle = aboutDetails?.heroTitle || aboutTexts.h1;
  const heroDescription = aboutDetails?.heroDescription || aboutTexts.h2;
  // const missionTitle = aboutDetails?.missionTitle || aboutTexts.h3;
  // const missionDescription = aboutDetails?.missionDescription || aboutTexts.h4;
  const values =
    aboutDetails?.values && aboutDetails.values.length > 0
      ? aboutDetails.values
      : [
          { title: aboutTexts.authenticity, description: aboutTexts.h7 },
          { title: aboutTexts.integrity, description: aboutTexts.h8 },
          { title: aboutTexts.community, description: aboutTexts.h9 },
        ];
  const storyTitle = aboutDetails?.storyTitle || aboutTexts.h10;
  // Split storyDescription into paragraphs or use fallback
  const storyParagraphs = aboutDetails?.storyDescription
    ? aboutDetails.storyDescription.split("\n").filter((p) => p.trim())
    : [aboutTexts.h11, aboutTexts.h12, aboutTexts.h13];

  const title = aboutDetails?.title || aboutTexts.h1;
  const description = aboutDetails?.description || aboutTexts.h2;
  const imageUrl = aboutDetails?.imageUrl
    ? aboutDetails.imageUrl.startsWith("http")
      ? aboutDetails.imageUrl
      : aboutDetails.imageUrl
    : "/images/mission-image.png";
  return (
    <section className="flex flex-col">
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/spiritual.png"
            alt={heroTitle}
            fill
            priority
            className="object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
          {loading ? (
            <p className="text-lg">Loading...</p>
          ) : error ? (
            <div className="space-y-4">
              <p className="text-red-300">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-primary hover:bg-primary/90"
              >
                Tryagain
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

      {/* Mission Section */}
      {!loading && !error && (
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Leaf className="h-8 w-8 text-primary" />
                  <h2 className="text-3xl font-bold">{title}</h2>
                </div>
                <p className="text-lg text-gray-600">{description}</p>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link href="/user/shop">{aboutTexts.h5}</Link>
                </Button>
              </div>
              <div className="relative h-96 rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Values Section */}
      {!loading && !error && (
        <div className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold">
              {aboutTexts.h6}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div
                  key={index}
                  className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  {index === 0 && (
                    <Gem className="h-12 w-12 text-primary mb-4" />
                  )}
                  {index === 1 && (
                    <Target className="h-12 w-12 text-primary mb-4" />
                  )}
                  {index === 2 && (
                    <Users className="h-12 w-12 text-primary mb-4" />
                  )}
                  <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                  <p className="text-gray-800">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Story Section */}
      {!loading && !error && (
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 mb-12">
              <History className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">{storyTitle}</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                {storyParagraphs.map((paragraph, index) => (
                  <p key={index} className="text-lg text-gray-800">
                    {paragraph}
                  </p>
                ))}
              </div>
              <div className="relative h-96 rounded-lg overflow-hidden">
                <Image
                  src="/images/Story-of-Rudraksha.jpg"
                  alt={storyTitle}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
