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

const EditBlogCategoryForm = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [blogCategoryName, setBlogCategoryName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

        // FIX: Access the categories array correctly
        // It's inside data.data.categories, not just data.data
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit blog categories.");
      router.push("/admin/dashboard/blogcategory");
      setIsSubmitting(false);
      return;
    }

    if (!blogCategoryName.trim()) {
      toast.error("Blog category name is required");
      return;
    }

    if (!slug.trim()) {
      toast.error("Slug is required");
      return;
    }

    const payload = {
      name: blogCategoryName.trim(),
      slug: slug.trim(),
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
                  <Label className="text-white/80">Blog Category Name</Label>
                  <Input
                    className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white w-full"
                    placeholder="Enter blog category name"
                    required
                    value={blogCategoryName}
                    onChange={(e) => setBlogCategoryName(e.target.value)}
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
