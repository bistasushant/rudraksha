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

  // State for form values and errors
  const [formValues, setFormValues] = useState({
    productName: "",
    price: "",
    stockQuantity: "",
    description: "",
    benefit: "",
  });
  const [formErrors, setFormErrors] = useState<{
    productName: string;
    categories: string;
    price: string;
    stockQuantity: string;
    description: string;
    benefit: string;
    images: string;
    general: string; // Added general property
  }>({
    productName: "",
    categories: "",
    price: "",
    stockQuantity: "",
    description: "",
    benefit: "",
    images: "",
    general: "", // Initialize general property
  });

  useEffect(() => {
    if (!admin?.token) {
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
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
        setFormErrors((prev) => ({
          ...prev,
          categories: "Failed to load categories. Please try again later.",
        }));
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [admin, router]);

  const validateField = (name: string, value: any) => {
    let error = "";
    switch (name) {
      case "productName":
        if (!value?.trim()) {
          error = "Product name cannot be empty.";
        }
        break;
      case "categories":
        if (selectedCategories.length === 0) {
          error = "At least one category must be selected.";
        }
        break;
      case "price":
        const priceValue = parseFloat(value);
        if (!value) {
          error = "Price cannot be empty.";
        } else if (isNaN(priceValue) || priceValue <= 0) {
          error = "Price must be a valid positive number.";
        }
        break;
      case "stockQuantity":
        const stockValue = parseInt(value, 10);
        if (!value) {
          error = "Stock quantity cannot be empty.";
        } else if (isNaN(stockValue) || stockValue < 0) {
          error = "Stock quantity must be a valid non-negative number.";
        }
        break;
      case "description":
        if (!value?.trim()) {
          error = "Description cannot be empty.";
        }
        break;
      case "benefit":
        if (!value?.trim()) {
          error = "Benefit cannot be empty.";
        }
        break;
      case "images":
        if (selectedImages.length === 0) {
          error = "At least one image must be uploaded.";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));

    // Validate on change
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setFormErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map((file) => {
        if (file.size > 2 * 1024 * 1024) {
          setFormErrors((prev) => ({
            ...prev,
            images: "File size exceeds 2MB limit.",
          }));
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
          const filteredImages = images.filter(Boolean) as string[];
          setSelectedImages((prev) => [...prev, ...filteredImages]);
          const error = validateField(
            "images",
            filteredImages.length > 0 ? filteredImages : []
          );
          setFormErrors((prev) => ({ ...prev, images: error }));
        })
        .catch(() => {
          setFormErrors((prev) => ({
            ...prev,
            images: "Error uploading images.",
          }));
        });
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((cat) => cat !== categoryId)
        : [...prev, categoryId]
    );
    const error = validateField("categories", selectedCategories);
    setFormErrors((prev) => ({ ...prev, categories: error }));
  };

  const resetForm = (form: HTMLFormElement) => {
    form.reset();
    setFormValues({
      productName: "",
      price: "",
      stockQuantity: "",
      description: "",
      benefit: "",
    });
    setFormErrors({
      productName: "",
      categories: "",
      price: "",
      stockQuantity: "",
      description: "",
      benefit: "",
      images: "",
      general: "", // Reset general error
    });
    setSelectedImages([]);
    setSelectedCategories([]);
    setIsDropdownOpen(false);
    setSearchTerm("");
  };

  const validateForm = () => {
    const errors = {
      productName: validateField("productName", formValues.productName),
      categories: validateField("categories", selectedCategories),
      price: validateField("price", formValues.price),
      stockQuantity: validateField("stockQuantity", formValues.stockQuantity),
      description: validateField("description", formValues.description),
      benefit: validateField("benefit", formValues.benefit),
      images: validateField("images", selectedImages),
      general: "", // Reset general error on validation
    };
    setFormErrors(errors);

    // Return true if there are no errors
    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      router.push("/admin/dashboard/products");
      setIsSubmitting(false);
      return;
    }

    // Validate all fields
    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    const data = {
      name: formValues.productName.trim(),
      slug: generateSlug(formValues.productName.trim()),
      category: selectedCategories,
      price: parseFloat(formValues.price),
      stock: parseInt(formValues.stockQuantity, 10),
      description: formValues.description.trim(),
      benefit: formValues.benefit.trim(),
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

      resetForm(form);
      router.push("/admin/dashboard/products");
    } catch (error) {
      console.error("Add Product Error:", error);
      setFormErrors((prev) => ({
        ...prev,
        general:
          error instanceof Error
            ? error.message
            : "An error occurred while adding the product.",
      }));
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
              <Label className="text-white/80">Product Image *</Label>
              <div className="relative group w-full max-w-md mx-auto">
                <label
                  htmlFor="image-upload"
                  className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-purple-500 transition-colors ${
                    formErrors.images ? "border-red-500" : "border-white/30"
                  }`}
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
                {formErrors.images && (
                  <p className="text-red-500 text-sm mt-1">
                    {formErrors.images}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-white/80">Product Name *</Label>
                <Input
                  name="productName"
                  className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                    formErrors.productName
                      ? "border-red-500"
                      : "border-white/20"
                  }`}
                  placeholder="Enter product name"
                  value={formValues.productName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                />
                {formErrors.productName && (
                  <p className="text-red-500 text-sm">
                    {formErrors.productName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Categories *</Label>
                <div className="relative">
                  <button
                    type="button"
                    className={`flex items-center justify-between w-full bg-white/5 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-gray-500 ${
                      formErrors.categories
                        ? "border-red-500 border"
                        : "border-white/20"
                    }`}
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
                          onClick={(e) => e.stopPropagation()}
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
                {formErrors.categories && (
                  <p className="text-red-500 text-sm">
                    {formErrors.categories}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Price (Rs) *</Label>
                <Input
                  name="price"
                  type="number"
                  className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                    formErrors.price ? "border-red-500" : "border-white/20"
                  }`}
                  placeholder="0.00"
                  value={formValues.price}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                />
                {formErrors.price && (
                  <p className="text-red-500 text-sm">{formErrors.price}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Stock Quantity *</Label>
                <Input
                  name="stockQuantity"
                  type="number"
                  className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                    formErrors.stockQuantity
                      ? "border-red-500"
                      : "border-white/20"
                  }`}
                  placeholder="Enter quantity"
                  value={formValues.stockQuantity}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  min="0"
                  disabled={isSubmitting}
                />
                {formErrors.stockQuantity && (
                  <p className="text-red-500 text-sm">
                    {formErrors.stockQuantity}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Description *</Label>
                <Textarea
                  name="description"
                  className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white h-32 w-full ${
                    formErrors.description
                      ? "border-red-500"
                      : "border-white/20"
                  }`}
                  placeholder="Describe the product..."
                  value={formValues.description}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm">
                    {formErrors.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Benefit *</Label>
                <Textarea
                  name="benefit"
                  className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white h-32 w-full ${
                    formErrors.benefit ? "border-red-500" : "border-white/20"
                  }`}
                  placeholder="Describe the benefit..."
                  value={formValues.benefit}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  disabled={isSubmitting}
                />
                {formErrors.benefit && (
                  <p className="text-red-500 text-sm">{formErrors.benefit}</p>
                )}
              </div>
            </div>

            {formErrors.general && (
              <p className="text-red-500 text-sm">{formErrors.general}</p>
            )}

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
                disabled={isSubmitting}
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
