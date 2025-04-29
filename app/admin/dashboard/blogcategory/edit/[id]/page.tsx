"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import { ICategory } from "@/types";

// Function to generate slug (optional, if slug is editable)
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .trim();
};

const EditBlogCategoryForm = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [blogCategoryName, setBlogCategoryName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State for form errors
  const [formErrors, setFormErrors] = useState<{
    blogCategoryName: string;
    general: string;
  }>({
    blogCategoryName: "",
    general: "",
  });

  const params = useParams();
  const blogCategorySlug = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!admin?.token) {
      toast.error("Please log in to edit blog categories.");
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit blog categories.");
      router.push("/admin/dashboard/blogcategory");
      return;
    }
    const fetchCategory = async () => {
      if (!blogCategorySlug) {
        toast.error("No blog category slug provided in URL.");
        router.push("/admin/dashboard/blogcategory");
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch("/api/blogcategory", {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(
            errorData || `Failed to fetch blog categories: ${response.status}`
          );
        }

        const data = await response.json();

        // Access the categories array correctly
        const blogCategories = Array.isArray(data.data?.blogCategories)
          ? data.data.blogCategories
          : [];

        const blogCategory = blogCategories.find(
          (cat: ICategory) => cat.slug === blogCategorySlug
        );

        if (!blogCategory) {
          throw new Error(
            `Blog category with slug "${blogCategorySlug}" not found`
          );
        }

        setBlogCategoryName(blogCategory.name || "");
        setSlug(blogCategory.slug || "");
      } catch (error) {
        console.error("Error fetching blog category:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load blog category data",
          {
            description: "Please try again or check the console for details.",
          }
        );
        router.push("/admin/dashboard/blogcategory");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [admin, blogCategorySlug, router]);

  // Validation function
  const validateField = (name: string, value: any) => {
    let error = "";
    switch (name) {
      case "blogCategoryName":
        if (!value?.trim()) {
          error = "Blog category name cannot be empty.";
        }
        break;
      default:
        break;
    }
    return error;
  };

  // Handle input change with validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setBlogCategoryName(value);

    // Validate on change
    const error = validateField("blogCategoryName", value);
    setFormErrors((prev) => ({ ...prev, blogCategoryName: error }));
  };

  // Handle blur with validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const error = validateField("blogCategoryName", value);
    setFormErrors((prev) => ({ ...prev, blogCategoryName: error }));
  };

  // Validate entire form before submission
  const validateForm = () => {
    const errors = {
      blogCategoryName: validateField("blogCategoryName", blogCategoryName),
      general: "",
    };
    setFormErrors(errors);

    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit blog categories.");
      router.push("/admin/dashboard/blogcategory");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: blogCategoryName.trim(),
      slug: slug.trim() || generateSlug(blogCategoryName.trim()), // Generate slug if not editable
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/blogcategory/${blogCategorySlug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(payload),
      });

      const rawBody = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(rawBody);
        } catch {
          errorData = rawBody || "No response body";
        }
        throw new Error(
          errorData.message ||
            `Failed to update blog category: ${response.status}`
        );
      }

      toast.success("Blog category updated successfully!", {
        description: "The blog category has been updated.",
      });
      router.push("/admin/dashboard/blogcategory");
    } catch (error) {
      console.error("Error updating blog category:", error);
      setFormErrors((prev) => ({
        ...prev,
        general:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      }));
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
        {
          description: "Check the console for more details.",
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
    return null;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center mb-4">
        <Button
          type="button"
          variant="secondary"
          className="bg-white/10 hover:bg-white/20 text-white"
          onClick={() => router.back()}
          disabled={isSubmitting || isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">Edit Blog Category</h1>

      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-3xl mx-auto">
        <CardHeader>
          <h2 className="text-lg font-bold text-white">
            Blog Category Details
          </h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-white text-center py-4">
              Loading Blog category data...
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-white/80">Blog Category Name *</Label>
                  <Input
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                      formErrors.blogCategoryName
                        ? "border-red-500"
                        : "border-white/20"
                    }`}
                    placeholder="Enter blog category name"
                    required
                    value={blogCategoryName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                  />
                  {formErrors.blogCategoryName && (
                    <p className="text-red-500 text-sm">
                      {formErrors.blogCategoryName}
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
                  {isSubmitting ? "Updating..." : "Update Blog Category"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EditBlogCategoryForm;
