"use client";

import { useState, useEffect } from "react";
import { NotebookPen, CalendarDays, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

import { useLanguage } from "@/context/language-context";
import {
  blogEnglishTexts,
  blogChineseTexts,
  blogHindiTexts,
  blogNepaliTexts,
} from "@/language";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Define the BlogPost interface to match the API response structure
interface BlogPost {
  id: string; // Changed to string to match API's 'id' field
  title: string;
  excerpt: string;
  date: string;
  author: string;
  image: string;
}

// Define the ApiBlog interface to match the API response structure
interface ApiBlog {
  id: string; // Assuming 'id' is a string
  heading?: string; // Optional, based on your API response
  description?: string; // Optional
  createdAt?: string; // Optional
  name?: string; // Optional
  image?: string; // Optional
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export default function Blog() {
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null); // Changed to string
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { selectedLanguage } = useLanguage();

  useEffect(() => {
    const fetchBlogPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/blog");

        if (!response.ok) {
          throw new Error(`Failed to fetch blog posts: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("API Response:", data);

        let postsArray: BlogPost[] = [];

        // Map API data to BlogPost interface
        if (data?.data?.blogs && Array.isArray(data.data.blogs)) {
          postsArray = data.data.blogs.map((blog: ApiBlog) => ({
            id: blog.id, // API returns 'id' as string
            title: blog.heading || "Untitled", // Use 'heading' as title
            excerpt: blog.description || "No description available", // Use 'description' as excerpt
            date: blog.createdAt
              ? new Date(blog.createdAt).toLocaleDateString("en-CA")
              : new Date().toLocaleDateString("en-CA"), // Use createdAt or fallback to today
            author: blog.name || "Unknown Author", // Fallback for missing author
            image: blog.image || "/images/rudrakhsa.png", // Fallback image
          }));
        } else {
          console.warn("Invalid API response format. Using fallback data.");
          postsArray = getFallbackBlogPosts();
        }

        setBlogPosts(postsArray);
      } catch (err) {
        console.error("Error fetching blog posts:", err);
        setError((err as Error).message || "Failed to fetch blog posts");
        setBlogPosts(getFallbackBlogPosts());
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPosts();
  }, []);

  // Fallback data in case API fails
  const getFallbackBlogPosts = (): BlogPost[] => {
    return [
      {
        id: "1",
        title: "The Spiritual Significance of Rudraksha",
        excerpt:
          "Rudraksha, the sacred seed of the Rudraksha tree, holds immense spiritual and mystical significance in Hinduism and Buddhism...",
        date: "2024-03-15",
        author: "Spiritual Guide",
        image: "/images/rudrakhsa.png",
      },
      {
        id: "2",
        title: "Choosing the Right Rudraksha for You",
        excerpt:
          "Choosing the right Rudraksha bead can be a deeply personal and spiritual journey for many individuals seeking to harness the sacred energies...",
        date: "2024-03-12",
        author: "Ayurvedic Expert",
        image: "/images/rudrakhsa.png",
      },
    ];
  };

  // Define blogTexts based on selected language
  const blogTexts =
    selectedLanguage === "chinese"
      ? blogChineseTexts
      : selectedLanguage === "hindi"
      ? blogHindiTexts
      : selectedLanguage === "nepali"
      ? blogNepaliTexts
      : blogEnglishTexts;

  return (
    <>
      <Header />
      <section className="flex flex-col">
        {/* Hero Section */}
        <div className="relative h-[60vh] w-full overflow-hidden">
          <div className="absolute inset-0">
            <Image
              src="/images/Bestback.png"
              alt="Blog"
              fill
              priority
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
          <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
            <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
              {blogTexts.h1}
            </h1>
            <p className="mb-8 max-w-2xl text-lg md:text-xl">{blogTexts.h2}</p>
          </div>
        </div>

        {/* Blog Content */}
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main Content */}
              <div className="space-y-8 lg:col-span-2">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-lg">Loading blog posts...</p>
                  </div>
                ) : error ? (
                  <div className="rounded-lg bg-red-50 p-6 text-center">
                    <p className="text-red-600">{error}</p>
                    <Button
                      onClick={() => window.location.reload()}
                      className="mt-4"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : blogPosts.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-lg text-gray-600">No blog posts found</p>
                  </div>
                ) : (
                  blogPosts.map((post) => {
                    const isExpanded = expandedPostId === post.id;
                    const displayText = isExpanded
                      ? post.excerpt
                      : truncateText(post.excerpt, 200);

                    return (
                      <article
                        key={post.id}
                        className="overflow-hidden rounded-xl bg-white shadow-lg"
                      >
                        <div className="relative h-64">
                          <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-8">
                          <div className="mb-4 flex items-center gap-4 text-gray-500">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-5 w-5" />
                              <span>{post.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-5 w-5" />
                              <span>{post.author}</span>
                            </div>
                          </div>
                          <h2 className="mb-4 text-2xl font-bold">
                            {post.title}
                          </h2>
                          <p className="mb-6 text-gray-600">{displayText}</p>
                          <Button
                            className="bg-primary transition-transform hover:bg-primary/90"
                            onClick={() =>
                              setExpandedPostId(isExpanded ? null : post.id)
                            }
                          >
                            {isExpanded ? "Read Less" : "Read More"}
                            <ArrowRight
                              className={`ml-2 h-4 w-4 transition-transform ${
                                isExpanded ? "rotate-90" : ""
                              }`}
                            />
                          </Button>
                        </div>
                      </article>
                    );
                  })
                )}

                {/* Pagination */}
                {!loading && !error && blogPosts.length > 0 && (
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" className="rounded-full">
                      1
                    </Button>
                    <Button variant="outline" className="rounded-full">
                      2
                    </Button>
                    <Button variant="outline" className="rounded-full">
                      3
                    </Button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-8">
                {/* Search */}
                <div className="rounded-xl bg-white p-6 shadow-lg">
                  <h3 className="mb-4 text-xl font-bold">{blogTexts.h3}</h3>
                  <div className="relative">
                    <Input
                      type="search"
                      placeholder="Search posts..."
                      className="h-12 pl-10"
                    />
                    <NotebookPen className="absolute left-3 top-3 text-gray-400" />
                  </div>
                </div>

                {/* Categories */}
                <div className="rounded-xl bg-white p-6 shadow-lg">
                  <h3 className="mb-4 text-xl font-bold">
                    {blogTexts.categories}
                  </h3>
                  <ul className="space-y-2">
                    {[
                      "Spiritual Growth",
                      "Meditation",
                      "Ayurveda",
                      "Ancient Wisdom",
                    ].map((category) => (
                      <li
                        key={category}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        <ArrowRight className="h-4 w-4" />
                        <button className="text-left">{category}</button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recent Posts */}
                {!loading && !error && blogPosts.length > 0 && (
                  <div className="rounded-xl bg-white p-6 shadow-lg">
                    <h3 className="mb-4 text-xl font-bold">{blogTexts.h4}</h3>
                    <div className="space-y-4">
                      {blogPosts.slice(0, 3).map((post) => (
                        <div key={post.id} className="flex items-center gap-4">
                          <div className="relative h-16 w-16 flex-shrink-0">
                            <Image
                              src={post.image}
                              alt={post.title}
                              fill
                              className="rounded-lg object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium hover:text-primary">
                              {post.title}
                            </h4>
                            <p className="text-sm text-gray-500">{post.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
