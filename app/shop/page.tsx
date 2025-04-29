"use client";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

import { useLanguage } from "@/context/language-context";
import {
  shopEnglishTexts,
  shopChineseTexts,
  shopHindiTexts,
  shopNepaliTexts,
} from "@/language";
import { useState, useMemo, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Category {
  id: string;
  name: string;
}

interface EnhancedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category: string[];
  categoryNames?: string[];
  stock?: number;
  description?: string;
  benefit?: string;
  rating?: number;
  mukhi?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ShopPage() {
  const { selectedLanguage } = useLanguage();
  const [sortOption, setSortOption] = useState("featured");
  const [featuredProducts, setFeaturedProducts] = useState<EnhancedProduct[]>(
    []
  );
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorCategories, setErrorCategories] = useState<string | null>(null);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Price filter states
  const [priceRange, setPriceRange] = useState([0, 5000]);
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("5000");
  const [minMaxPrice, setMinMaxPrice] = useState({ min: 0, max: 5000 });
  // Add state to track if price filter has been activated
  const [isPriceFilterActive, setIsPriceFilterActive] = useState(false);

  // Debounce timer for price inputs
  const [debouncedPriceTimer, setDebouncedPriceTimer] =
    useState<NodeJS.Timeout | null>(null);

  // Check if any filter is active
  const isFilterActive = useMemo(() => {
    return (
      selectedCategories.length > 0 ||
      showInStockOnly ||
      (isPriceFilterActive &&
        (priceRange[0] > minMaxPrice.min || priceRange[1] < minMaxPrice.max))
    );
  }, [
    selectedCategories,
    showInStockOnly,
    priceRange,
    minMaxPrice,
    isPriceFilterActive,
  ]);

  const shopTexts =
    selectedLanguage === "chinese"
      ? shopChineseTexts
      : selectedLanguage === "hindi"
      ? shopHindiTexts
      : selectedLanguage === "nepali"
      ? shopNepaliTexts
      : shopEnglishTexts;

  // Fix for footer position - ensure consistent minimum height
  const pageMinHeight = "min-h-[80vh]";

  // Fetch categories and products
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/category");
        if (!response.ok)
          throw new Error(`Error fetching categories: ${response.statusText}`);
        const result = await response.json();
        const fetchedCategories = result.data.categories || [];
        setCategories(fetchedCategories);
        fetchProducts(fetchedCategories);
      } catch (error: unknown) {
        setErrorCategories(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const fetchProducts = async (categoriesList: Category[]) => {
    try {
      const response = await fetch("/api/products");
      if (!response.ok)
        throw new Error(`Error fetching products: ${response.statusText}`);
      const result = await response.json();
      const fetchedProducts = result.data.products || [];

      const enhancedProducts = fetchedProducts.map(
        (product: EnhancedProduct) => {
          const categoryArray = Array.isArray(product.category)
            ? product.category
            : [product.category];
          const categoryNames = categoryArray.map((catId) => {
            const category = categoriesList.find((cat) => cat.id === catId);
            return category ? category.name : `Unknown Category (${catId})`;
          });

          return {
            ...product,
            category: categoryArray,
            categoryNames,
            images: product.images || [
              product.image || "/images/default-image.png",
            ],
          };
        }
      );

      setFeaturedProducts(enhancedProducts);

      if (enhancedProducts.length > 0) {
        const min = Math.max(
          0,
          Math.min(
            ...enhancedProducts.map((p: EnhancedProduct) =>
              Number(p.price || 0)
            )
          )
        );
        const max = Math.min(
          5000,
          Math.max(
            ...enhancedProducts.map((p: EnhancedProduct) =>
              Number(p.price || 0)
            )
          )
        );
        setMinMaxPrice({ min, max });
        setPriceRange([min, max]);
        setMinPrice(min.toString());
        setMaxPrice(max.toString());
      }
    } catch (error: unknown) {
      setErrorProducts(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setLoadingProducts(false);
      setLoadingCategories(false);
    }
  };

  // Filter handlers
  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSelectedCategories((prev) =>
      checked ? [...prev, categoryId] : prev.filter((id) => id !== categoryId)
    );
  };

  const handleInStockChange = (checked: boolean) => setShowInStockOnly(checked);

  // Improved price filter handlers with debounce - updated to activate price filter
  const updatePriceRangeWithDebounce = useCallback(
    (min: number, max: number) => {
      if (debouncedPriceTimer) {
        clearTimeout(debouncedPriceTimer);
      }

      const timer = setTimeout(() => {
        setPriceRange([min, max]);
        // Activate price filter on user interaction
        setIsPriceFilterActive(true);
      }, 500); // 500ms debounce

      setDebouncedPriceTimer(timer);
    },
    [debouncedPriceTimer]
  );

  const handlePriceInputChange = (type: "min" | "max", value: string) => {
    // Allow empty string during typing
    if (value === "") {
      if (type === "min") {
        setMinPrice("");
      } else {
        setMaxPrice("");
      }
      return;
    }

    const numValue = Number(value);
    if (isNaN(numValue)) return;

    // Activate price filter on user interaction
    setIsPriceFilterActive(true);

    if (type === "min") {
      const validMin = Math.max(0, Math.min(numValue, Number(maxPrice) - 10));
      setMinPrice(validMin.toString());
      updatePriceRangeWithDebounce(validMin, priceRange[1]);
    } else {
      const validMax = Math.min(
        5000,
        Math.max(numValue, Number(minPrice) + 10)
      );
      setMaxPrice(validMax.toString());
      updatePriceRangeWithDebounce(priceRange[0], validMax);
    }
  };

  // Handle price input blur for empty values
  const handlePriceInputBlur = (type: "min" | "max") => {
    if (type === "min" && minPrice === "") {
      setMinPrice("0");
      updatePriceRangeWithDebounce(0, priceRange[1]);
    } else if (type === "max" && maxPrice === "") {
      setMaxPrice("5000");
      updatePriceRangeWithDebounce(priceRange[0], 5000);
    }
  };

  const handleSliderChange = (value: number[]) => {
    if (value.length === 2) {
      // Activate price filter on slider interaction
      setIsPriceFilterActive(true);
      setPriceRange(value);
      setMinPrice(value[0].toString());
      setMaxPrice(value[1].toString());
    }
  };

  // Get selected category names
  const selectedCategoryNames = useMemo(() => {
    return categories
      .filter((category) => selectedCategories.includes(category.id))
      .map((category) => category.name);
  }, [categories, selectedCategories]);

  // Filtered and sorted products - modified to check isPriceFilterActive
  const filteredProducts = useMemo(() => {
    return featuredProducts.filter((product) => {
      const passesCategory =
        selectedCategories.length === 0 ||
        product.category.some((catId) => selectedCategories.includes(catId));
      const passesStock =
        !showInStockOnly || (product.stock !== undefined && product.stock > 0);
      // Only apply price filter if it has been activated by user interaction
      const passesPrice =
        !isPriceFilterActive ||
        (product.price >= priceRange[0] && product.price <= priceRange[1]);
      const passesSearch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description &&
          product.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        (product.categoryNames &&
          product.categoryNames.some((name) =>
            name.toLowerCase().includes(searchQuery.toLowerCase())
          ));
      return passesCategory && passesStock && passesPrice && passesSearch;
    });
  }, [
    featuredProducts,
    selectedCategories,
    showInStockOnly,
    priceRange,
    searchQuery,
    isPriceFilterActive,
  ]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    switch (sortOption) {
      case "price-low":
        return sorted.sort(
          (a, b) => Number(a.price || 0) - Number(b.price || 0)
        );
      case "price-high":
        return sorted.sort(
          (a, b) => Number(b.price || 0) - Number(a.price || 0)
        );
      case "newest":
        return sorted.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
      case "rating":
        return sorted.sort(
          (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
        );
      case "featured":
      default:
        return sorted;
    }
  }, [filteredProducts, sortOption]);

  const getStockSummary = () => {
    const inStock = featuredProducts.filter(
      (p) => p.stock !== undefined && p.stock > 0
    ).length;
    const total = featuredProducts.length;
    return `${inStock} of ${total} products in stock`;
  };

  // Clear a single category filter
  const removeCategoryFilter = (categoryId: string) => {
    setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
  };

  // Clear all filters - updated to reset price filter activation
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setShowInStockOnly(false);
    setPriceRange([minMaxPrice.min, minMaxPrice.max]);
    setMinPrice(minMaxPrice.min.toString());
    setMaxPrice(minMaxPrice.max.toString());
    setSearchQuery("");
    // Deactivate price filter
    setIsPriceFilterActive(false);
  };

  if (loadingProducts || loadingCategories) {
    return (
      <div
        className={`flex justify-center items-center py-20 ${pageMinHeight}`}
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (errorProducts || errorCategories) {
    return (
      <div
        className={`container mx-auto px-4 py-10 text-red-500 ${pageMinHeight}`}
      >
        Error: {errorProducts || errorCategories}
      </div>
    );
  }

  return (
    <>
      <Header />
      <div
        className={`container mx-auto px-4 py-8 sm:px-6 overflow-x-hidden ${pageMinHeight}`}
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 mt-16">
          {shopTexts.shop}
        </h1>
        <p className="text-gray-600 text-base sm:text-lg md:text-xl dark:text-gray-700 mb-4">
          {shopTexts.h1}
        </p>
        <div className="border-b border-gray-600/20 mb-4" />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters - Desktop */}
          <div className="hidden lg:block w-64 space-y-6">
            <div>
              <h3 className="font-medium text-2xl mb-3">
                {shopTexts.categories}
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={(checked) =>
                        handleCategoryChange(category.id, checked === true)
                      }
                    />
                    <Label
                      htmlFor={`category-${category.id}`}
                      className="text-md cursor-pointer"
                    >
                      {category.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium text-2xl mb-3">
                {shopTexts.priceFilter}
              </h3>
              <div className="mb-4">
                <Slider
                  min={0}
                  max={5000}
                  step={10}
                  value={priceRange}
                  onValueChange={handleSliderChange}
                />
              </div>
              <div className="flex space-x-4 items-center mt-4">
                <div className="w-1/2">
                  <Label htmlFor="min-price" className="text-sm mb-1 block">
                    Min ($)
                  </Label>
                  <Input
                    id="min-price"
                    type="text"
                    inputMode="numeric"
                    value={minPrice}
                    onChange={(e) =>
                      handlePriceInputChange("min", e.target.value)
                    }
                    onBlur={() => handlePriceInputBlur("min")}
                    className="w-full"
                  />
                </div>
                <div className="w-1/2">
                  <Label htmlFor="max-price" className="text-sm mb-1 block">
                    Max ($)
                  </Label>
                  <Input
                    id="max-price"
                    type="text"
                    inputMode="numeric"
                    value={maxPrice}
                    onChange={(e) =>
                      handlePriceInputChange("max", e.target.value)
                    }
                    onBlur={() => handlePriceInputBlur("max")}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium text-2xl mb-3">
                {shopTexts.availability}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="in-stock"
                    checked={showInStockOnly}
                    onCheckedChange={(checked) =>
                      handleInStockChange(checked === true)
                    }
                  />
                  <Label htmlFor="in-stock" className="text-md cursor-pointer">
                    {shopTexts.inStock}
                  </Label>
                </div>
                <div className="text-sm text-gray-700 mt-1">
                  {getStockSummary()}
                </div>
              </div>
            </div>

            {/* Clear all filters button */}
            {isFilterActive && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="w-full mt-4"
              >
                Clear All Filters
              </Button>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto ml-auto">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="lg:hidden flex items-center w-full sm:w-auto"
                    >
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[80vw] max-w-[300px]">
                    <div className="space-y-6 py-4">
                      <div>
                        <h3 className="font-medium mb-3">
                          {shopTexts.categories}
                        </h3>
                        <div className="space-y-2">
                          {categories.map((category) => (
                            <div
                              key={category.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`mobile-category-${category.id}`}
                                checked={selectedCategories.includes(
                                  category.id
                                )}
                                onCheckedChange={(checked) =>
                                  handleCategoryChange(
                                    category.id,
                                    checked === true
                                  )
                                }
                              />
                              <Label
                                htmlFor={`mobile-category-${category.id}`}
                                className="text-sm cursor-pointer"
                              >
                                {category.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />
                      <div>
                        <h3 className="font-medium mb-3">
                          {shopTexts.priceFilter}
                        </h3>
                        <div className="mb-4">
                          <Slider
                            min={0}
                            max={5000}
                            step={10}
                            value={priceRange}
                            onValueChange={handleSliderChange}
                          />
                        </div>
                        <div className="flex space-x-4 items-center mt-4">
                          <div className="w-1/2">
                            <Label
                              htmlFor="mobile-min-price"
                              className="text-sm mb-1 block"
                            >
                              Min ($)
                            </Label>
                            <Input
                              id="mobile-min-price"
                              type="text"
                              inputMode="numeric"
                              value={minPrice}
                              onChange={(e) =>
                                handlePriceInputChange("min", e.target.value)
                              }
                              onBlur={() => handlePriceInputBlur("min")}
                              className="w-full"
                            />
                          </div>
                          <div className="w-1/2">
                            <Label
                              htmlFor="mobile-max-price"
                              className="text-sm mb-1 block"
                            >
                              Max ($)
                            </Label>
                            <Input
                              id="mobile-max-price"
                              type="text"
                              inputMode="numeric"
                              value={maxPrice}
                              onChange={(e) =>
                                handlePriceInputChange("max", e.target.value)
                              }
                              onBlur={() => handlePriceInputBlur("max")}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="font-medium mb-3">
                          {shopTexts.availability}
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="mobile-in-stock"
                              checked={showInStockOnly}
                              onCheckedChange={(checked) =>
                                handleInStockChange(checked === true)
                              }
                            />
                            <Label
                              htmlFor="mobile-in-stock"
                              className="text-sm cursor-pointer"
                            >
                              In Stock
                            </Label>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {getStockSummary()}
                          </div>
                        </div>
                      </div>

                      {/* Clear all filters button (mobile) */}
                      {isFilterActive && (
                        <Button
                          variant="outline"
                          onClick={clearAllFilters}
                          className="w-full mt-4"
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>

                {/* Sort Dropdown */}
                <div className="w-full sm:w-auto">
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Clear All Filters Button - Above the filter tabs */}
            {isFilterActive && (
              <div className="mb-4">
                <Button
                  variant="outline"
                  onClick={clearAllFilters}
                  className="w-full sm:w-auto"
                >
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Active Filters Display - Styled like the category tabs */}
            <div className="mb-8">
              <div className="flex overflow-x-auto pb-2 border-b border-gray-200">
                {/* All Products button styled like tab triggers */}
                <button
                  onClick={clearAllFilters}
                  className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap mr-2 ${
                    selectedCategories.length === 0
                      ? "bg-gray-800/80 text-white/80"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All Products
                </button>

                {/* Active filters styled like tab triggers */}
                {selectedCategories.length > 0 &&
                  selectedCategoryNames.map((name, index) => (
                    <div
                      key={index}
                      className="flex items-center whitespace-nowrap px-4 py-2 text-sm font-medium rounded-md bg-gray-800/80 text-primary-foreground mr-2"
                    >
                      {name}
                      <button
                        className="ml-2 focus:outline-none"
                        onClick={() =>
                          removeCategoryFilter(selectedCategories[index])
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
              </div>
            </div>

            {/* Products Grid - directly showing filtered products */}
            <div className="mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedProducts.length > 0 ? (
                  sortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        images: product.images,
                        stock: product.stock,
                      }}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-10 text-gray-500">
                    No products match your current filters.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
