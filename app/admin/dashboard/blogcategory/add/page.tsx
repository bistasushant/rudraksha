"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";

// Function to generate slug
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .trim();
};

const AddBlogCategoryForm = () => {
  const router = useRouter();
  const [blogCategoryName, setBlogCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { admin } = useAuth();

  // State for form errors
  const [formErrors, setFormErrors] = useState<{
    blogCategoryName: string;
    general: string;
  }>({
    blogCategoryName: "",
    general: "",
  });

  useEffect(() => {
    if (!admin?.token) {
      toast.error("Please log in to add categories.");
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add blog categories.");
      router.push("/admin/dashboard/blogcategory");
    }
  }, [admin, router]);

  // Validation function for blog category name
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
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add blog categories.");
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
      slug: generateSlug(blogCategoryName.trim()),
    };

    try {
      if (!admin?.token) {
        throw new Error("Unauthorized: Please log in to add a blog category.");
      }

      const response = await fetch("/api/blogcategory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message ||
            `Failed to add blog category: ${response.status}`
        );
      }

      toast.success("Blog category added successfully!", {
        description: `Blog category "${blogCategoryName}" has been created.`,
      });

      router.push("/admin/dashboard/blogcategory");
    } catch (error) {
      setFormErrors((prev) => ({
        ...prev,
        general:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      }));
      toast.error("Error adding category", {
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
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
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">
        Add New Blog Category
      </h1>

      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-3xl mx-auto">
        <CardHeader>
          <h2 className="text-lg font-bold text-white">
            Blog Category Details
          </h2>
        </CardHeader>
        <CardContent>
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
                  placeholder="Enter category name"
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
                {isSubmitting ? "Adding..." : "Add Blog Category"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddBlogCategoryForm;
