"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { ICategory } from "@/types";

const EditCategoryForm = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State for form errors
  const [formErrors, setFormErrors] = useState<{
    categoryName: string;
    general: string;
  }>({
    categoryName: "",
    general: "",
  });

  const params = useParams();
  const categorySlug = Array.isArray(params.id) ? params.id[0] : params.id;

  useEffect(() => {
    if (!admin?.token) {
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      router.push("/admin/dashboard/category");
      return;
    }
    const fetchCategory = async () => {
      if (!categorySlug) {
        setFormErrors((prev) => ({
          ...prev,
          general: "No category slug provided in URL.",
        }));
        router.push("/admin/dashboard/category");
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch("/api/category", {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(
            errorData || `Failed to fetch categories: ${response.status}`
          );
        }

        const data = await response.json();
        const categories = Array.isArray(data.data?.categories)
          ? data.data.categories
          : [];

        const category = categories.find(
          (cat: ICategory) => cat.slug === categorySlug
        );

        if (!category) {
          throw new Error(`Category with slug "${categorySlug}" not found`);
        }

        setCategoryName(category.name || "");
        setDescription(category.description || "");
        setIsActive(category.isActive ?? true);
      } catch (error) {
        console.error("Error fetching category:", error);
        setFormErrors((prev) => ({
          ...prev,
          general:
            error instanceof Error
              ? error.message
              : "Failed to load category data",
        }));
        router.push("/admin/dashboard/category");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [admin, categorySlug, router]);

  const validateField = (name: string, value: string): string => {
    let error = "";
    switch (name) {
      case "categoryName":
        if (!value?.trim()) {
          error = "Category name cannot be empty.";
        }
        break;
      default:
        break;
    }
    return error;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setCategoryName(value);

    // Validate on change
    const error = validateField("categoryName", value);
    setFormErrors((prev) => ({ ...prev, categoryName: error }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const error = validateField("categoryName", value);
    setFormErrors((prev) => ({ ...prev, categoryName: error }));
  };

  const validateForm = () => {
    const errors = {
      categoryName: validateField("categoryName", categoryName),
      general: "",
    };
    setFormErrors(errors);

    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      router.push("/admin/dashboard/category");
      setIsSubmitting(false);
      return;
    }

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    const payload = {
      name: categoryName.trim(),
      description: description.trim() || undefined,
      isActive,
    };

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/category/${categorySlug}`, {
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
          errorData.message || `Failed to update category: ${response.status}`
        );
      }

      router.push("/admin/dashboard/category");
    } catch (error) {
      console.error("Error updating category:", error);
      setFormErrors((prev) => ({
        ...prev,
        general:
          error instanceof Error ? error.message : "Something went wrong",
      }));
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
      <h1 className="text-2xl font-bold text-white mb-4">Edit Category</h1>

      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-3xl mx-auto">
        <CardHeader>
          <h2 className="text-lg font-bold text-white">Category Details</h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-white text-center py-4">
              Loading category data...
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-white/80">Category Name *</Label>
                  <Input
                    className={`bg-white/5 border focus:ring-2 focus:ring-purple-500 text-white w-full ${
                      formErrors.categoryName
                        ? "border-red-500"
                        : "border-white/20"
                    }`}
                    placeholder="Enter category name"
                    value={categoryName}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={isSubmitting}
                  />
                  {formErrors.categoryName && (
                    <p className="text-red-500 text-sm">
                      {formErrors.categoryName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">
                    Description (Optional)
                  </Label>
                  <Textarea
                    className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white h-32 w-full"
                    placeholder="Describe the category..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white/80">Status</Label>
                  <div className="flex items-center">
                    <Switch
                      checked={isActive}
                      onCheckedChange={setIsActive}
                      className="mr-2"
                      disabled={isSubmitting}
                    />
                    <Label className="text-white/80">
                      {isActive ? "Active" : "Inactive"}
                    </Label>
                  </div>
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
                  {isSubmitting ? "Updating..." : "Update Category"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EditCategoryForm;
