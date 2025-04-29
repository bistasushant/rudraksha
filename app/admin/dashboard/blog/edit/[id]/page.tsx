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
import { IBlog, IBlogcategory } from "@/types";
import Image from "next/image";

interface FormData {
  id: string;
  name: string;
  heading: string;
  description: string;
  slug: string;
  image: string;
}

// Reusable debounce hook
const useDebounce = (value: string, delay: number): string => {
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

const EditBlogForm: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const routeId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [blog, setBlog] = useState<IBlog | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<IBlogcategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);
  const { admin } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    id: "",
    name: "",
    heading: "",
    description: "",
    slug: "",
    image: "",
  });

  // State for form errors
  const [formErrors, setFormErrors] = useState<{
    name: string;
    heading: string;
    description: string;
    selectedCategories: string;
    image: string;
    general: string;
  }>({
    name: "",
    heading: "",
    description: "",
    selectedCategories: "",
    image: "",
    general: "",
  });

  // RBAC Check and Data Fetching
  useEffect(() => {
    if (!admin?.token) {
      toast.error("Please log in to edit blogs.");
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit blogs.");
      router.push("/admin/dashboard/blog");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadingCategories(true);

        // Fetch blog data
        const blogResponse = await fetch(`/api/blog?page=1&limit=100`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (!blogResponse.ok) {
          const errorData = await blogResponse.json();
          throw new Error(errorData.message || "Failed to fetch blog");
        }

        const blogResult = await blogResponse.json();
        const blogs = Array.isArray(blogResult.data?.blogs)
          ? blogResult.data.blogs
          : [];

        const blogData = blogs.find(
          (p: IBlog) => p.id === routeId || p.slug === routeId
        );

        if (!blogData || typeof blogData !== "object") {
          throw new Error("Blog data not found or invalid in response");
        }

        setBlog(blogData);
        setOriginalSlug(blogData.slug || "");
        setFormData({
          id: blogData.id || "",
          name: blogData.name || "",
          heading: blogData.heading || "",
          description: blogData.description || "",
          slug: blogData.slug || "",
          image: blogData.image || "",
        });

        // Set initial categories
        if (Array.isArray(blogData.category)) {
          setSelectedCategories(blogData.category);
        } else if (blogData.category) {
          setSelectedCategories([blogData.category]);
        }

        // Fetch blog categories
        const categoriesResponse = await fetch("/api/blogcategory", {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!categoriesResponse.ok) {
          const errorData = await categoriesResponse.json();
          throw new Error(
            errorData.message || "Failed to fetch blog categories"
          );
        }

        const categoriesResult = await categoriesResponse.json();
        setCategories(categoriesResult.data?.blogCategories || []);

        // Validate initial form data
        setFormErrors({
          name: validateField("name", blogData.name || ""),
          heading: validateField("heading", blogData.heading || ""),
          description: validateField("description", blogData.description || ""),
          selectedCategories: validateField(
            "selectedCategories",
            blogData.category || []
          ),
          image: validateField("image", blogData.image || ""),
          general: "",
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to load data.",
          { description: "Please try again later." }
        );
        router.push("/admin/dashboard/blog");
      } finally {
        setLoading(false);
        setLoadingCategories(false);
      }
    };

    fetchData();
  }, [admin, routeId, router]);

  // Validation function
  const validateField = (name: string, value: string | string[]): string => {
    let error = "";
    switch (name) {
      case "name":
        if (typeof value !== "string" || !value.trim()) {
          error = "Blog name cannot be empty.";
        } else if (typeof value === "string" && value.trim().length < 3) {
          error = "Blog name must be at least 3 characters long.";
        }
        break;
      case "heading":
        if (typeof value !== "string" || !value.trim()) {
          error = "Blog heading cannot be empty.";
        } else if (typeof value === "string" && value.trim().length < 3) {
          error = "Blog heading must be at least 3 characters long.";
        }
        break;
      case "description":
        if (typeof value !== "string" || !value.trim()) {
          error = "Blog description cannot be empty.";
        } else if (typeof value === "string" && value.trim().length < 10) {
          error = "Blog description must be at least 10 characters long.";
        }
        break;
      case "selectedCategories":
        if (!Array.isArray(value) || value.length === 0) {
          error = "At least one category must be selected.";
        }
        break;
      case "image":
        if (typeof value !== "string" || !value) {
          error = "Blog image is required.";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2MB limit.");
        setFormErrors((prev) => ({
          ...prev,
          image: "File size exceeds 2MB limit.",
        }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setFormData((prev) => ({
          ...prev,
          image: imageData,
        }));
        const error = validateField("image", imageData);
        setFormErrors((prev) => ({ ...prev, image: error }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: "",
    }));
    const error = validateField("image", "");
    setFormErrors((prev) => ({ ...prev, image: error }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const newCategories = prev.includes(categoryId)
        ? prev.filter((cat) => cat !== categoryId)
        : [...prev, categoryId];
      const error = validateField("selectedCategories", newCategories);
      setFormErrors((prev) => ({ ...prev, selectedCategories: error }));
      return newCategories;
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const fieldMap: Record<string, string> = {
      blogName: "name",
      blogHeading: "heading",
      blogDescription: "description",
      blogSlug: "slug",
    };

    const stateField = fieldMap[name] || name;

    setFormData((prev) => ({
      ...prev,
      [stateField]: value,
    }));

    // Validate on change
    const error = validateField(stateField, value);
    setFormErrors((prev) => ({ ...prev, [stateField]: error }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const fieldMap: Record<string, string> = {
      blogName: "name",
      blogHeading: "heading",
      blogDescription: "description",
      blogSlug: "slug",
    };

    const stateField = fieldMap[name] || name;
    const error = validateField(stateField, value);
    setFormErrors((prev) => ({ ...prev, [stateField]: error }));
  };

  // Validate entire form before submission
  const validateForm = (): boolean => {
    const errors = {
      name: validateField("name", formData.name),
      heading: validateField("heading", formData.heading),
      description: validateField("description", formData.description),
      selectedCategories: validateField(
        "selectedCategories",
        selectedCategories
      ),
      image: validateField("image", formData.image),
      general: "",
    };
    setFormErrors(errors);

    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit blogs.");
      router.push("/admin/dashboard/blog");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the form errors before submitting.");
      setIsSubmitting(false);
      return;
    }

    try {
      const updateData: {
        name: string;
        heading: string;
        description: string;
        category: string[];
        image: string;
        slug?: string;
      } = {
        name: formData.name.trim(),
        heading: formData.heading.trim(),
        description: formData.description.trim(),
        category: selectedCategories,
        image: formData.image,
      };

      if (formData.slug && formData.slug.trim() !== originalSlug) {
        updateData.slug = formData.slug.trim();
      }

      const updateEndpoint = originalSlug
        ? `/api/blog/${originalSlug}`
        : `/api/blog/${routeId}`;

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
        throw new Error(data.message || "Failed to update blog");
      }

      toast.success("Blog updated successfully");
      router.push("/admin/dashboard/blog");
    } catch (error) {
      console.error("Update error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update blog";
      setFormErrors((prev) => ({
        ...prev,
        general: errorMessage,
      }));
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render nothing if unauthorized (handled by useEffect redirect)
  if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
    return null;
  }

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
          onClick={() => router.push("/admin/dashboard/blog")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        Edit Blog: {blog?.name || "Loading..."}
      </h1>
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-3xl mx-auto">
          <CardHeader>
            <h2 className="text-lg font-bold text-white">Blog Details</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label className="text-white/80">Blog Image *</Label>
                <div className="relative group w-full max-w-md mx-auto">
                  <label
                    htmlFor="image-upload"
                    className={`flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-purple-500 transition-colors ${
                      formErrors.image ? "border-red-500" : "border-white/30"
                    }`}
                  >
                    {formData.image ? (
                      <div className="relative w-full h-full p-2">
                        <Image
                          src={formData.image}
                          alt="Blog image preview"
                          fill
                          className="object-contain rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage();
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 rounded-full hover:bg-red-400 transition-colors"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-white/50 mb-2 group-hover:text-purple-400" />
                        <span className="text-white/70 group-hover:text-purple-400">
                          Click to upload an image
                        </span>
                        <span className="text-sm text-white/50">
                          PNG, JPG (max. 2MB)
                        </span>
                      </>
                    )}
                  </label>
                  <input
                    id="image-upload"
                    name="image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isSubmitting}
                  />
                  {formErrors.image && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.image}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-white/80">Blog Name *</Label>
                  <Input
                    name="blogName"
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                      formErrors.name ? "border-red-500" : "border-white/20"
                    }`}
                    placeholder="Enter blog name"
                    value={formData.name}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    required
                    disabled={isSubmitting}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-sm">{formErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Blog Heading *</Label>
                  <Input
                    name="blogHeading"
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                      formErrors.heading ? "border-red-500" : "border-white/20"
                    }`}
                    placeholder="Enter Blog Heading"
                    value={formData.heading}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    required
                    disabled={isSubmitting}
                  />
                  {formErrors.heading && (
                    <p className="text-red-500 text-sm">{formErrors.heading}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Blog Categories *</Label>
                  <div className="relative">
                    <button
                      type="button"
                      className={`flex items-center justify-between w-full bg-white/5 rounded-lg px-4 py-2 text-white ${
                        formErrors.selectedCategories
                          ? "border-red-500"
                          : "border-white/20"
                      } focus:ring-2 focus:ring-gray-500`}
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
                          <span className="text-white/50">
                            Select blog categories
                          </span>
                        )}
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-white/50 transition-transform ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {formErrors.selectedCategories && (
                      <p className="text-red-500 text-sm mt-1">
                        {formErrors.selectedCategories}
                      </p>
                    )}
                    {isDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="p-2">
                          <Input
                            placeholder="Search blog categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white/5 border-white/20 text-white w-full"
                            disabled={isSubmitting}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        {loadingCategories ? (
                          <div className="px-4 py-2 text-white/70">
                            Loading blog categories...
                          </div>
                        ) : filteredCategories.length > 0 ? (
                          filteredCategories.map((category) => (
                            <div
                              key={category.id}
                              className={`px-4 py-2 cursor-pointer hover:bg-white text-white hover:text-gray-900/90 flex items-center justify-between ${
                                category.id &&
                                selectedCategories.includes(category.id)
                                  ? "bg-purple-600/70"
                                  : ""
                              }`}
                              onClick={() =>
                                category.id && handleCategoryToggle(category.id)
                              }
                            >
                              <span>{category.name}</span>
                              {category.id &&
                                selectedCategories.includes(category.id) && (
                                  <span className="text-green-400">✓</span>
                                )}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-white/70">
                            No blog categories found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Description *</Label>
                  <Textarea
                    name="blogDescription"
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white h-32 w-full ${
                      formErrors.description
                        ? "border-red-500"
                        : "border-white/20"
                    }`}
                    placeholder="Describe the blog..."
                    value={formData.description}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    required
                    disabled={isSubmitting}
                  />
                  {formErrors.description && (
                    <p className="text-red-500 text-sm">
                      {formErrors.description}
                    </p>
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
                  {isSubmitting ? "Updating..." : "Update Blog"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EditBlogForm;
