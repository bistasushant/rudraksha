"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";
import { IBlog } from "@/types";
import Image from "next/image";

const EditBlogForm = () => {
  const router = useRouter();
  const params = useParams();
  const routeId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [blog, setBlog] = useState<IBlog | null>(null);
  const [originalSlug, setOriginalSlug] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { admin } = useAuth();
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    heading: "",
    description: "",
    slug: "",
    image: "",
  });

  // RBAC Check: Redirect users without edit permission
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

        // Fetch paginated list since there's no single blog endpoint
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
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to load data.",
          { description: "Please try again later." }
        );
        router.push("/admin/dashboard/blog");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [admin, routeId, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: "",
    }));
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to edit blogs.");
      router.push("/admin/dashboard/blog");
      setIsSubmitting(false);
      return;
    }

    if (!formData.image) {
      toast.error("Image is required");
      setIsSubmitting(false);
      return;
    }

    try {
      const updateData: {
        name: string;
        heading: string;
        description: string;
        image: string;
        slug?: string;
      } = {
        name: formData.name.trim(),
        heading: formData.heading.trim(),
        description: formData.description.trim(),
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
      toast.error(
        error instanceof Error ? error.message : "Failed to update blog"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render nothing if unauthorized (handled by useEffect redirect)
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
                <Label className="text-white/80">Blog Image</Label>
                <div className="relative group w-full max-w-md mx-auto">
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-purple-500 transition-colors"
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
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-white/80">Blog Name</Label>
                  <Input
                    name="blogName"
                    className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white w-full"
                    placeholder="Enter blog name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Blog Heading</Label>
                  <Input
                    name="blogHeading"
                    className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white w-full"
                    placeholder="Enter Blog Heading"
                    value={formData.heading}
                    onChange={handleInputChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/80">Description</Label>
                  <Textarea
                    name="blogDescription"
                    className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white h-32 w-full"
                    placeholder="Describe the blog..."
                    value={formData.description}
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
