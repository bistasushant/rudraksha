"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useLanguage } from "@/context/language-context";
import { useCurrency } from "@/context/currency-context";
import {
  featureEnglishTexts,
  featureChineseTexts,
  featureHindiTexts,
  featureNepaliTexts,
} from "@/language";

interface ProductCardProps {
  product?: {
    id: string;
    name: string;
    price: number;
    images: string[];
    categoryNames?: string[];
    stock?: number; // Added stock property
  };
}

const ProductCard = ({ product: propProduct }: ProductCardProps) => {
  const [fetchedProduct, setFetchedProduct] = useState<{
    id: string;
    name: string;
    price: number;
    images: string[];
    categoryNames?: string[];
    stock?: number; // Added stock property
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();
  const { selectedLanguage } = useLanguage();
  const { selectedCurrency, exchangeRates } = useCurrency();

  const featureTexts =
    selectedLanguage === "chinese"
      ? featureChineseTexts
      : selectedLanguage === "hindi"
      ? featureHindiTexts
      : selectedLanguage === "nepali"
      ? featureNepaliTexts
      : featureEnglishTexts;

  // Fetch data from API if no prop is provided (for standalone testing)
  useEffect(() => {
    if (!propProduct) {
      const fetchProduct = async () => {
        try {
          const response = await fetch("/api/products");
          if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
          }
          const result = await response.json();
          // For demo, take the first product; adjust based on your needs
          const firstProduct = result.data.products[0];
          setFetchedProduct({
            id: firstProduct.id || "unknown",
            name: firstProduct.name || "Unnamed Product",
            price: firstProduct.price || 0,
            images: firstProduct.images || [
              firstProduct.image || "/images/default-image.png",
            ],
            categoryNames: firstProduct.categoryNames || [],
            stock: firstProduct.stock || 0, // Include stock information
          });
        } catch (error: unknown) {
          setError(
            error instanceof Error ? error.message : "An unknown error occurred"
          );
        } finally {
          setLoading(false);
        }
      };

      fetchProduct();
    } else {
      setFetchedProduct(propProduct); // Use prop if provided
      setLoading(false);
    }
  }, [propProduct]);

  const product = fetchedProduct; // Use fetched data or prop

  const handleAddToCart = () => {
    if (product) {
      // Only add to cart if in stock
      if (product.stock && product.stock > 0) {
        addItem({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.images[0] || "/images/default-image.png",
          quantity: 1,
        });
      }
    }
  };

  const getPriceInSelectedCurrency = (price: number): string => {
    const exchangeRate = exchangeRates[selectedCurrency] || 1;
    return (price * exchangeRate).toFixed(2);
  };

  // Check if product is in stock
  const isInStock = product?.stock === undefined || product.stock > 0;

  if (loading) {
    return <div>Loading product...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!product) {
    return <div>No product data available</div>;
  }

  return (
    <div className="group relative rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300">
      <div className="relative h-64 w-full overflow-hidden">
        <Link href={`/product/${product.id}`}>
          <Image
            src={product.images[0] || "/images/default-image.png"}
            alt={product.name}
            width={400}
            height={320}
            className={`object-cover transition-transform duration-500 ${
              !isInStock ? "opacity-70" : "opacity-100"
            } group-hover:opacity-100`}
          />
        </Link>

        {/* Out of stock badge */}
        {!isInStock && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
            Out of Stock
          </div>
        )}

        {/* Only show quick add button if in stock */}
        {isInStock && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Add ${product.name} to cart`}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-5 w-5 text-gray-600 hover:text-red-500 transition-colors" />
          </Button>
        )}
      </div>

      <div className="p-4">
        <div className="mb-2">
          <Link href={`/product/${product.id}`} className="hover:underline">
            <h3 className="font-medium text-lg">{product.name}</h3>
          </Link>

          {/* Display category names if available */}
          {product.categoryNames && product.categoryNames.length > 0 && (
            <div className="text-sm text-gray-500 mt-1">
              {product.categoryNames.join(", ")}
            </div>
          )}

          {/* Stock indicator */}
          <div className="mt-1 text-sm">
            {isInStock ? (
              <span className="text-green-600 font-medium">
                In Stock {product.stock !== undefined && `(${product.stock})`}
              </span>
            ) : (
              <span className="text-red-500 font-medium">Out of Stock</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-bold text-lg">
            {selectedCurrency === "USD"
              ? "$"
              : selectedCurrency === "CNY"
              ? "¥"
              : selectedCurrency === "INR"
              ? "₹"
              : selectedCurrency === "NPR"
              ? "₨"
              : ""}{" "}
            {getPriceInSelectedCurrency(product.price)}
          </span>
          {/* Only enable add to cart button if in stock */}
          <Button
            size="sm"
            onClick={handleAddToCart}
            className={`transition-opacity ${
              isInStock
                ? "opacity-0 group-hover:opacity-100"
                : "opacity-50 cursor-not-allowed"
            }`}
            aria-label={`Add ${product.name} to cart`}
            disabled={!isInStock}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            {featureTexts.add}
          </Button>
        </div>
      </div>
    </div>
  );
};

export { ProductCard };
