"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, X, ArrowLeft, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import { ICategory } from "@/types";

// Utility to generate slug from product name
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .trim();
};

// Custom debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const AddProductForm = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

  useEffect(() => {
    if (!admin?.token) {
      toast.error("Please log in to add products.");
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add products.");
      router.push("/admin/dashboard/products");
    }
  }, [admin, router]);

  useEffect(() => {
    if (!admin?.token || !["admin", "editor"].includes(admin.role)) return;
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/category", {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message ||
              `Failed to fetch categories: ${response.status}`
          );
        }

        const result = await response.json();
        const categoriesData = result.data?.categories || [];
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to load categories.",
          { description: "Please try again later." }
        );
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [admin, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => {
        if (file.size > 2 * 1024 * 1024) {
          toast.error("File size exceeds 2MB limit.");
          return null;
        }
        const reader = new FileReader();
        return new Promise<string>((resolve, reject) => {
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newImages)
        .then((images) => {
          setSelectedImages((prev) => [
            ...prev,
            ...(images.filter(Boolean) as string[]),
          ]);
        })
        .catch(() => toast.error("Error uploading images."));
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((cat) => cat !== categoryId)
        : [...prev, categoryId]
    );
  };

  const resetForm = (form: HTMLFormElement) => {
    form.reset();
    setSelectedImages([]);
    setSelectedCategories([]);
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add products.");
      router.push("/admin/dashboard/products");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(form);
    const productName = formData.get("productName") as string;
    const price = parseFloat(formData.get("price") as string);
    const stock = parseInt(formData.get("stockQuantity") as string, 10);
    const description = formData.get("description") as string;
    const benefit = formData.get("benefit") as string;

    if (!productName?.trim()) {
      toast.error("Product name is required.");
      setIsSubmitting(false);
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error("At least one category must be selected.");
      setIsSubmitting(false);
      return;
    }
    if (isNaN(price) || price <= 0) {
      toast.error("Price must be a valid positive number.");
      setIsSubmitting(false);
      return;
    }
    if (isNaN(stock) || stock < 0) {
      toast.error("Stock quantity must be a valid non-negative number.");
      setIsSubmitting(false);
      return;
    }
    if (!description?.trim()) {
      toast.error("Description is required.");
      setIsSubmitting(false);
      return;
    }
    if (!benefit?.trim()) {
      toast.error("Benefit is required.");
      setIsSubmitting(false);
      return;
    }

    const data = {
      name: productName.trim(),
      slug: generateSlug(productName.trim()),
      category: selectedCategories,
      price,
      stock,
      description: description.trim(),
      benefit: benefit.trim(),
      images: selectedImages,
    };

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add product.");
      }

      toast.success("Product added successfully!");
      resetForm(form);
      router.push("/admin/dashboard/products");
    } catch (error) {
      console.error("Add Product Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while adding the product."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
    return null;
  }

  // Filter categories based on debounced search term
  const filteredCategories = categories.filter((category) =>
    category.name
      .toLowerCase()
      .includes(debouncedSearchTerm.toLowerCase().trim())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center mb-4">
        <Button
          type="button"
          variant="secondary"
          className="bg-white/10 hover:bg-white/20 text-white"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">Add New Product</h1>

      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-3xl mx-auto">
        <CardHeader>
          <h2 className="text-lg font-bold text-white">Product Details</h2>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className="text-white/80">Product Image</Label>
              <div className="relative group w-full max-w-md mx-auto">
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-purple-500 transition-colors"
                >
                  {selectedImages.length > 0 ? (
                    <div className="w-full p-2 grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative aspect-square">
                          <Image
                            src={image}
                            alt={`Preview ${index + 1}`}
                            width={100}
                            height={100}
                            className="object-cover w-full h-full rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedImages((prev) =>
                                prev.filter((_, i) => i !== index)
                              )
                            }
                            className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full hover:bg-red-400 transition-colors"
                          >
                            <X className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-white/50 mb-2 group-hover:text-purple-400" />
                      <span className="text-white/70 group-hover:text-purple-400">
                        Click to upload or drag and drop
                      </span>
                      <span className="text-sm text-white/50">
                        PNG, JPG (max. 2MB)
                      </span>
                    </>
                  )}
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  multiple
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-white/80">Product Name</Label>
                <Input
                  name="productName"
                  className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white w-full"
                  placeholder="Enter product name"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Categories</Label>
                <div className="relative">
                  <button
                    type="button"
                    className="flex items-center justify-between w-full bg-white/5 border-white/20 focus:ring-2 focus:ring-gray-500 text-white rounded-lg px-4 py-2"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    disabled={isSubmitting}
                  >
                    <div className="flex flex-wrap gap-2">
                      {selectedCategories.length > 0 ? (
                        selectedCategories.map((categoryId) => (
                          <span
                            key={categoryId}
                            className="bg-purple-600 text-white text-sm px-2 py-1 rounded flex items-center"
                          >
                            {
                              categories.find((cat) => cat.id === categoryId)
                                ?.name
                            }
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategoryToggle(categoryId);
                              }}
                              className="ml-1 text-white/80 hover:text-white cursor-pointer"
                            >
                              <X className="h-4 w-4" />
                            </span>
                          </span>
                        ))
                      ) : (
                        <span className="text-white/50">Select categories</span>
                      )}
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-white/50 transition-transform ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2">
                        <Input
                          placeholder="Search categories..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="bg-white/5 border-white/20 text-white w-full"
                          disabled={isSubmitting}
                          onClick={(e) => e.stopPropagation()} // Prevent dropdown from closing
                        />
                      </div>
                      {loadingCategories ? (
                        <div className="px-4 py-2 text-white/70">
                          Loading categories...
                        </div>
                      ) : filteredCategories.length > 0 ? (
                        filteredCategories.map((category) => (
                          <div
                            key={category.id}
                            className={`px-4 py-2 cursor-pointer hover:bg-white text-white hover:text-gray-900/90 flex items-center justify-between ${
                              selectedCategories.includes(category.id ?? "")
                                ? "bg-purple-600/70"
                                : ""
                            }`}
                            onClick={() =>
                              handleCategoryToggle(category.id ?? "")
                            }
                          >
                            <span>{category.name}</span>
                            {selectedCategories.includes(category.id ?? "") && (
                              <span className="text-green-400">✓</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-white/70">
                          No categories found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Price (Rs)</Label>
                <Input
                  name="price"
                  type="number"
                  className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white w-full"
                  placeholder="0.00"
                  required
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Stock Quantity</Label>
                <Input
                  name="stockQuantity"
                  type="number"
                  className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white w-full"
                  placeholder="Enter quantity"
                  required
                  min="0"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Description</Label>
                <Textarea
                  name="description"
                  className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white h-32 w-full"
                  placeholder="Describe the product..."
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Benefit</Label>
                <Textarea
                  name="benefit"
                  className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white h-32 w-full"
                  placeholder="Describe the benefit..."
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="secondary"
                className="bg-white/10 hover:bg-white/20 text-white"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSubmitting || selectedCategories.length === 0}
              >
                {isSubmitting ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProductForm;
