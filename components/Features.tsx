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

// Define the Product type based on your API structure
interface Product {
  id: string;
  name: string;
  slug: string;
  category: string[];
  price: number;
  image?: string; // Optional single image field
  images?: string[]; // Optional array of images (API might send multiple)
  featured?: boolean; // Optional flag for filtering
  // Add any other fields your ProductCard might need (e.g., description, rating)
}

// Interface for the API response structure
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
  const [showAll, setShowAll] = useState(false);
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
      setLoading(true); // Ensure loading state is set at the start
      setError(null); // Reset error state
      try {
        const response = await fetch("/api/products");
        if (!response.ok) {
          // Try to get a better error message
          let errorMsg = `Failed to fetch products: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (parseError) {
            /* Ignore if body isn't json */
            console.log(parseError);
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

        // Filter for products to display in this section
        // Shows products where 'featured' is true or undefined/null
        // Excludes products where 'featured' is explicitly false
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
              onClick={() => setShowAll(!showAll)}
              className="flex items-center text-primary hover:underline"
            >
              {showAll ? featureTexts.showLess : featureTexts.viewAll}{" "}
              {/* Use text from language context */}
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
            {(showAll ? featuredProducts : featuredProducts.slice(0, 4)).map(
              (product) => {
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
              }
            )}
          </div>
        )}
      </div>
    </section>
  );
}
