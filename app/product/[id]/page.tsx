"use client";
import React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

import Image from "next/image";
import { Star } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Product Interface (includes category ID/IDs)
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  salePrice?: number;
  rating: number;
  stock: number;
  category: string | string[]; // Category ID(s) from API
  mukhi?: string | number;
  benefit?: string;
  benefits?: string[];
  image?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
  slug?: string;
}

// --- Interfaces for API response (simplified) ---
interface ApiResponse<T> {
  error: boolean;
  message: string;
  data: T;
}

interface ProductListData {
  products: Product[];
  page?: number;
}

// Category interface
interface Category {
  id: string;
  name: string;
  description?: string;
}

interface CategoryListData {
  categories: Category[];
}

// Define props type compatible with Next.js PageProps
export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params); // Unwrap params using React.use()

  const [product, setProduct] = useState<Product | null>(null);
  const [categoryNames, setCategoryNames] = useState<string[]>([]); // State to hold mapped names
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string>(
    "/images/default-image.png"
  );
  const { addItem } = useCart();

  useEffect(() => {
    const fetchProductAndCategories = async () => {
      setLoading(true);
      setError(null);

      try {
        // --- Fetch Product Data ---
        const productResponse = await fetch(`/api/products`);

        if (!productResponse.ok) {
          let errorMsg = `Failed to fetch products: ${productResponse.statusText}`;
          try {
            const errorData = await productResponse.json();
            errorMsg = errorData.message || errorMsg;
          } catch (parseError) {
            console.log(parseError);
            throw new Error();
          }
          if (errorMsg.includes("Failed to fetch")) {
            errorMsg =
              "Failed to fetch product data. Please check network connection and server status.";
          }
          throw new Error(errorMsg);
        }

        const productData: ApiResponse<ProductListData> =
          await productResponse.json();

        if (
          productData.error ||
          !productData.data ||
          !Array.isArray(productData.data.products)
        ) {
          console.error(
            "Unexpected Product API response structure:",
            productData
          );
          throw new Error("Received invalid product data format from API.");
        }

        const allProducts = productData.data.products;

        // Find the specific product
        const fetchedProduct = allProducts.find((p: Product) => p.id === id);

        if (!fetchedProduct) {
          throw new Error(`Product with id ${id} not found`);
        }

        setProduct(fetchedProduct);

        // --- Fetch Categories to map IDs to names ---
        const categoryResponse = await fetch(`/api/category`);

        if (!categoryResponse.ok) {
          console.error(
            "Failed to fetch categories:",
            categoryResponse.statusText
          );
          throw new Error("Failed to fetch category data.");
        }

        const categoryData: ApiResponse<CategoryListData> =
          await categoryResponse.json();

        // Create a map of category IDs to names from the API response
        if (
          !categoryData.error &&
          categoryData.data &&
          Array.isArray(categoryData.data.categories)
        ) {
          const categoryMap: { [key: string]: string } = {};

          categoryData.data.categories.forEach((category: Category) => {
            categoryMap[category.id] = category.name;
          });

          // Map product's category IDs to names
          let resolvedCategoryNames: string[] = [];
          if (fetchedProduct.category) {
            const categoryIds = Array.isArray(fetchedProduct.category)
              ? fetchedProduct.category
              : [fetchedProduct.category];

            resolvedCategoryNames = categoryIds.map(
              (catId) => categoryMap[catId] || `Unknown Category (${catId})`
            );
          }

          setCategoryNames(resolvedCategoryNames);
        } else {
          console.error("Invalid category data format:", categoryData);
          setCategoryNames([]);
        }

        // --- Set Main Image ---
        const primaryImage =
          fetchedProduct.images?.[0] ||
          fetchedProduct.image ||
          "/images/default-image.png";
        setMainImage(primaryImage);
      } catch (error: unknown) {
        console.error("Error fetching data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unknown error occurred while fetching product details."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductAndCategories();
    } else {
      setError("Product ID is missing.");
      setLoading(false);
    }
  }, [id]); // Dependency array

  const handleThumbnailClick = (imageSrc: string) => {
    setMainImage(imageSrc);
  };

  const handleAddToCart = () => {
    if (!product) return;
    const cartImage =
      product.images?.[0] || product.image || "/images/default-image.png";
    addItem({
      id: product.id,
      name: product.name,
      price: product.salePrice ?? product.price,
      image: cartImage,
      quantity: 1,
    });
    toast.success("Added to cart", {
      description: `${product.name} has been added to your cart.`,
    });
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="container mx-auto p-4 min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">
          Error Loading Product
        </h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p>Sorry, we could not find the product with ID: {id}</p>
      </div>
    );
  }

  // --- Main Product Display ---
  return (
    <>
      <Header />
      <div className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-24 mb-8">
          {/* Image Section */}
          <div>
            <div className="mb-4 relative aspect-square">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                className="w-full h-full rounded-lg object-cover border"
                onError={() => setMainImage("/images/default-image.png")}
                priority
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex justify-start mt-4 space-x-2 md:space-x-4 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <div
                    key={index}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-md overflow-hidden cursor-pointer flex-shrink-0 border hover:border-primary ${
                      mainImage === image
                        ? "ring-2 ring-offset-2 ring-primary"
                        : "border-gray-300"
                    }`}
                    onClick={() => handleThumbnailClick(image)}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - thumbnail ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      onError={(e) =>
                        (e.currentTarget.src = "/images/default-image.png")
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div>
            {/* Category Breadcrumb */}
            {categoryNames.length > 0 && (
              <p className="text-sm text-gray-500 mb-2">
                {categoryNames.join(" / ")}
              </p>
            )}
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">
              {product.name}
            </h1>
            <p className="text-gray-700 mb-4 text-base">
              {product.description || "No description available."}
            </p>
            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <p
                className={`text-2xl font-semibold ${
                  product.salePrice ? "text-red-600" : "text-gray-900"
                }`}
              >
                Rs {(product.salePrice ?? product.price).toFixed(2)}
              </p>
              {product.salePrice && (
                <p className="text-lg text-gray-500 line-through">
                  Rs {product.price.toFixed(2)}
                </p>
              )}
            </div>
            {/* Rating */}
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium">Rating:</p>
              <div className="flex items-center">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    size={18}
                    fill={
                      index < Math.round(product.rating ?? 0)
                        ? "currentColor"
                        : "none"
                    }
                    className="text-yellow-500"
                    strokeWidth={
                      index < Math.round(product.rating ?? 0) ? 0 : 1
                    }
                  />
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  ({(product.rating ?? 0).toFixed(1)})
                </span>
              </div>
            </div>
            {/* Stock */}
            <p className="text-sm mb-2">
              Stock:{" "}
              <span
                className={
                  product.stock > 0
                    ? "text-green-600 font-medium"
                    : "text-red-600 font-medium"
                }
              >
                {product.stock > 0
                  ? `${product.stock} available`
                  : "Out of Stock"}
              </span>
            </p>
            {/* Category Display */}
            {categoryNames.length > 0 && (
              <p className="text-sm mb-2">
                Category: {categoryNames.join(", ")}
              </p>
            )}
            {/* Mukhi */}
            {product.mukhi && (
              <p className="text-sm mb-4">Mukhi: {product.mukhi}</p>
            )}
            {/* Benefits Section */}
            <div className="mt-6 mb-6">
              <h2 className="text-xl font-semibold mb-2">Benefits</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                {product.benefits && product.benefits.length > 0 ? (
                  product.benefits.map((b, index) => <li key={index}>{b}</li>)
                ) : product.benefit ? (
                  <li>{product.benefit}</li>
                ) : (
                  <li className="text-gray-500 italic">
                    No benefits information available.
                  </li>
                )}
              </ul>
            </div>
            {/* Add to Cart Button */}
            <div className="mt-6">
              <Button
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="w-full md:w-auto"
              >
                {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
