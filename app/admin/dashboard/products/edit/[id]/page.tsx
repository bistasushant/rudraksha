"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown, Upload, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import { ICategory, IProduct } from "@/types";
import { Types } from "mongoose";
import Image from "next/image";

const EditProductForm = () => {
  const router = useRouter();
  const params = useParams();
  const routeId = params.id as string;
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<IProduct | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string>("");
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { admin } = useAuth();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    price: 0,
    stock: 0,
    description: "",
    benefit: "",
    slug: "",
  });

  useEffect(() => {
    if (!admin?.token) {
      toast.error("Please log in to edit products.");
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit products.");
      router.push("/admin/dashboard/products");
    }
  }, [admin, router]);

  useEffect(() => {
    if (!admin?.token || !["admin", "editor"].includes(admin.role)) return;
    const fetchData = async () => {
      try {
        setLoading(true);

        const productResponse = await fetch(`/api/products/${routeId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (!productResponse.ok) {
          const errorData = await productResponse.json();
          throw new Error(errorData.message || "Failed to fetch product");
        }

        const productResult = await productResponse.json();
        const productData =
          productResult.data.products?.find(
            (p: IProduct) => p.slug === routeId || p.id === routeId
          ) || productResult.data;

        if (!productData) {
          throw new Error("Product data not found in response");
        }

        // console.log("Product data found:", productData);

        setProduct(productData);
        setOriginalSlug(productData.slug || "");

        setFormData({
          id: productData.id || "",
          name: productData.name || "",
          price: typeof productData.price === "number" ? productData.price : 0,
          stock: typeof productData.stock === "number" ? productData.stock : 0,
          description: productData.description || "",
          benefit: productData.benefit || "",
          slug: productData.slug || "",
        });

        // Set images array
        if (
          Array.isArray(productData.images) &&
          productData.images.length > 0
        ) {
          // console.log("Setting selectedImages:", productData.images);
          setSelectedImages(productData.images);
        } else {
          // console.log("No images found in product data");
          setSelectedImages([]);
        }

        if (Array.isArray(productData.category)) {
          const categoryIds = productData.category.map(
            (
              cat:
                | string
                | Types.ObjectId
                | { _id?: Types.ObjectId; id?: string }
            ) => {
              if (typeof cat === "string") return cat;
              if (typeof cat === "object" && cat !== null) {
                return cat._id?.toString() || cat.id?.toString() || String(cat);
              }
              return String(cat);
            }
          );
          setSelectedCategories(categoryIds);
        } else if (productData.category) {
          setSelectedCategories([productData.category.toString()]);
        }

        const categoriesResponse = await fetch("/api/category", {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (!categoriesResponse.ok) {
          const errorData = await categoriesResponse.json();
          throw new Error(errorData.message || "Failed to fetch categories");
        }

        const categoriesResult = await categoriesResponse.json();
        setCategories(categoriesResult.data?.categories || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to load data.",
          { description: "Please try again later." }
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [admin, routeId, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => {
        if (file.size > 2 * 1024 * 1024) {
          toast.error(`File ${file.name} exceeds 2MB limit.`);
          return null;
        }
        const reader = new FileReader();
        return new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      Promise.all(newImages)
        .then((images) => {
          setSelectedImages((prev) => [
            ...prev,
            ...images.filter((img): img is string => img !== null),
          ]);
          // console.log("Updated selectedImages after upload:", [
          //   ...selectedImages,
          //   ...images.filter((img): img is string => img !== null),
          // ]);
        })
        .catch(() => toast.error("Error processing some images."));
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // console.log("Images after removal:", updated);
      return updated;
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((cat) => cat !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit products.");
      router.push("/admin/dashboard/products");
      setIsSubmitting(false);
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error("At least one category is required.");
      setIsSubmitting(false);
      return;
    }

    try {
      const updateData: {
        name: string;
        category: string[];
        price: number;
        stock: number;
        description: string;
        benefit: string;
        images: string[];
        slug?: string;
      } = {
        name: formData.name,
        category: selectedCategories,
        price: formData.price,
        stock: formData.stock,
        description: formData.description,
        benefit: formData.benefit,
        images: selectedImages,
      };

      if (formData.slug && formData.slug !== originalSlug) {
        updateData.slug = formData.slug;
      }

      const updateEndpoint = originalSlug
        ? `/api/products/${originalSlug}`
        : `/api/products/${routeId}`;

      const response = await fetch(updateEndpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update product");
      }

      toast.success("Product updated successfully");
      router.push("/admin/dashboard/products");
    } catch (error) {
      console.error("Update error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update product"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
    return null; // Render nothing while redirecting
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center mb-4">
        <Button
          type="button"
          variant="secondary"
          className="bg-white/10 hover:bg-white/20 text-white"
          onClick={() => router.push("/admin/dashboard/products")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        Edit Product: {product?.name || "Loading..."}
      </h1>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-3xl mx-auto">
          <CardHeader>
            <h2 className="text-lg font-bold text-white">Product Details</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label className="text-white/80">Product Images</Label>
                <div className="relative group w-full max-w-md mx-auto">
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-purple-500 transition-colors"
                    aria-label="Upload product images"
                  >
                    {selectedImages.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 w-full h-full p-2 overflow-auto">
                        {selectedImages.map((image, index) => (
                          <div key={index} className="relative aspect-square">
                            <Image
                              src={image}
                              alt={`Preview ${index + 1}`}
                              width={100}
                              height={100}
                              className="object-cover w-full h-full rounded-lg"
                              // onError={() =>
                              //   console.error(
                              //     `Failed to load image ${index}`
                              //   )
                              // }
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full hover:bg-red-400 transition-colors"
                              aria-label={`Remove image ${index + 1}`}
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
                          PNG, JPG (max. 2MB each)
                        </span>
                      </>
                    )}
                  </label>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/png, image/jpeg"
                    className="hidden"
                    onChange={handleImageUpload}
                    multiple
                    disabled={isSubmitting}
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-white/80">Product Name</Label>
                  <Input
                    name="name"
                    className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white w-full"
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={handleInputChange}
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
                      aria-expanded={isDropdownOpen}
                      aria-controls="category-dropdown"
                    >
                      <div className="flex flex-wrap gap-2">
                        {selectedCategories.length > 0 ? (
                          selectedCategories.map((categoryId) => {
                            const category = categories.find(
                              (cat) => cat.id === categoryId
                            );
                            return (
                              <span
                                key={categoryId}
                                className="bg-purple-600 text-white text-sm px-2 py-1 rounded flex items-center"
                              >
                                {category ? category.name : "Unknown"}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCategoryToggle(categoryId);
                                  }}
                                  className="ml-1 text-white/80 hover:text-white cursor-pointer"
                                  aria-label={`Remove ${category?.name}`}
                                >
                                  <X className="h-4 w-4" />
                                </span>
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-white/50">
                            Select categories
                          </span>
                        )}
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-white/50 transition-transform ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isDropdownOpen && (
                      <div
                        id="category-dropdown"
                        className="absolute z-10 mt-1 w-full bg-slate-900 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            className={`px-4 py-2 cursor-pointer hover:bg-white/10 text-white hover:text-white flex items-center justify-between ${
                              selectedCategories.includes(category.id ?? "")
                                ? "bg-purple-600/70"
                                : ""
                            }`}
                            onClick={() =>
                              handleCategoryToggle(category.id ?? "")
                            }
                            role="option"
                            aria-selected={selectedCategories.includes(
                              category.id ?? ""
                            )}
                          >
                            <span>{category.name}</span>
                            {selectedCategories.includes(category.id ?? "") && (
                              <span className="text-green-400">✓</span>
                            )}
                          </div>
                        ))}
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
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Stock Quantity</Label>
                  <Input
                    name="stock"
                    type="number"
                    className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white w-full"
                    placeholder="Enter quantity"
                    value={formData.stock}
                    onChange={handleInputChange}
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
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Benefit</Label>
                  <Textarea
                    name="benefit"
                    className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white h-32 w-full"
                    placeholder="Describe the product..."
                    value={formData.benefit}
                    onChange={handleInputChange}
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
                  {isSubmitting ? "Updating..." : "Update Product"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EditProductForm;
