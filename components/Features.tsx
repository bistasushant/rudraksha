"use client";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { ProductCard } from "./product-card";
import { useLanguage } from "@/context/language-context";
import {
  featureEnglishTexts,
  featureChineseTexts,
  featureHindiTexts,
  featureNepaliTexts,
} from "@/language";
import { useRouter } from "next/navigation"; // Update import here

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string[];
  price: number;
  image?: string;
  images?: string[];
  featured?: boolean;
}

interface ApiResponse<T> {
  error: boolean;
  message: string;
  data: T;
}

interface ProductListData {
  products: Product[];
  page?: number;
}

export default function Features() {
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { selectedLanguage } = useLanguage();
  const featureTexts =
    selectedLanguage === "chinese"
      ? featureChineseTexts
      : selectedLanguage === "hindi"
      ? featureHindiTexts
      : selectedLanguage === "nepali"
      ? featureNepaliTexts
      : featureEnglishTexts;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          // Try to get a better error message
          let errorMsg = `Failed to fetch products: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (parseError) {
            console.error(parseError);
            throw new Error();
          }
          if (errorMsg.includes("Failed to fetch")) {
            errorMsg = "Failed to fetch products. Check network/server status.";
          }
          throw new Error(errorMsg);
        }

        const result: ApiResponse<ProductListData> = await response.json();

        if (
          result.error ||
          !result.data ||
          !Array.isArray(result.data.products)
        ) {
          console.error("Invalid API response structure:", result);
          throw new Error("Received invalid data format from API.");
        }

        const products = result.data.products || [];
        const featured = products.filter(
          (product: Product) => product.featured !== false
        );
        setFeaturedProducts(featured);
      } catch (error: unknown) {
        console.error("Error fetching features products:", error); // Log the actual error
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); // Empty dependency array ensures this runs once on mount

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 text-center text-red-500">
        <p className="font-semibold">Error loading featured products:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-bold text-gray-800">
            {featureTexts.featureproducts}
          </h2>
          {/* Show "View All" button only if there are more than 4 products */}
          {featuredProducts.length > 4 && (
            <button
              onClick={() => router.push("/shop")}
              className="flex items-center text-whiteanimate-fade-in bg-gradient-to-r from-gray-900 to-indigo-900 text-white border-none py-2 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {featureTexts.viewAll}
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          )}
        </div>

        {featuredProducts.length === 0 ? (
          <p className="text-center text-gray-500">
            {featureTexts.noProductsFound}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => {
              let primaryImage = "/images/default-image.png";
              if (
                product.images &&
                product.images.length > 0 &&
                product.images[0]
              ) {
                primaryImage = product.images[0];
              } else if (product.image) {
                primaryImage = product.image;
              }
              return (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    images: [primaryImage],
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
