"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { toast } from "sonner";

const AddBlogForm = () => {
  const router = useRouter();
  const { admin } = useAuth();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!admin?.token) {
      toast.error("Please log in to add blogs.");
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add blogs.");
      router.push("/admin/dashboard/blog");
    }
  }, [admin, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size exceeds 2MB limit.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = (form: HTMLFormElement) => {
    form.reset();
    setSelectedImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setIsSubmitting(true);

    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add blogs.");
      router.push("/admin/dashboard/blog");
      setIsSubmitting(false);
      return;
    }

    if (!selectedImage) {
      toast.error("Image is required.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(form);
    const blogName = formData.get("blogName") as string;
    const blogHeading = formData.get("blogHeading") as string;
    const blogDescription = formData.get("blogDescription") as string;

    if (!blogName?.trim()) {
      toast.error("Blog name is required.");
      setIsSubmitting(false);
      return;
    }
    if (!blogHeading?.trim()) {
      toast.error("Blog heading is required.");
      setIsSubmitting(false);
      return;
    }
    if (!blogDescription?.trim()) {
      toast.error("Description is required.");
      setIsSubmitting(false);
      return;
    }

    // Create data object with field names that match the API expectations
    const data = {
      name: blogName.trim(), // Changed from blogName to name
      heading: blogHeading.trim(), // Changed from blogHeading to heading
      description: blogDescription.trim(),
      image: selectedImage,
      // slug is optional - API will generate it if not provided
    };

    try {
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to add blog.");
      }

      toast.success("Blog added successfully!");
      resetForm(form);
      router.push("/admin/dashboard/blog");
    } catch (error) {
      console.error("Add Blog Error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while adding the blog."
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
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">Add New Blog</h1>
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
                  {selectedImage ? (
                    <div className="relative w-full h-full p-2">
                      <Image
                        src={selectedImage}
                        alt="Blog image preview"
                        fill
                        className="object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(null);
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Blog"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
export default AddBlogForm;
