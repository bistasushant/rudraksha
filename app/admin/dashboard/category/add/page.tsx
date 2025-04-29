"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

const AddCategoryForm = () => {
  const router = useRouter();
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { admin } = useAuth();

  useEffect(() => {
    if (!admin?.token) {
      toast.error("Please log in to add categories.");
      router.push("/admin");
      return;
    }
    if (!["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add categories.");
      router.push("/admin/dashboard/category");
    }
  }, [admin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); // Prevent double submission
    if (!admin?.token || !["admin", "editor"].includes(admin.role)) {
      toast.error("You do not have permission to add categories.");
      router.push("/admin/dashboard/category");
      setIsSubmitting(false);
      return;
    }
    const payload = {
      name: categoryName,
      slug: generateSlug(categoryName), // Auto-generate slug
      description,
      isActive,
    };

    try {
      if (!admin?.token) {
        throw new Error("Unauthorized: Please log in to add a category.");
      }

      const response = await fetch("/api/category", {
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
          responseData.message || `Failed to add category: ${response.status}`
        );
      }

      toast.success("Category added successfully!", {
        description: `Category "${categoryName}" has been created.`,
      });

      router.push("/admin/dashboard/category");
    } catch (error) {
      toast.error("Error adding category", {
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false); // Re-enable button after submission
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
      <h1 className="text-2xl font-bold text-white mb-4">Add New Category</h1>

      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-3xl mx-auto">
        <CardHeader>
          <h2 className="text-lg font-bold text-white">Category Details</h2>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-white/80">Category Name</Label>
                <Input
                  className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white w-full"
                  placeholder="Enter category name"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Description (Optional)</Label>
                <Textarea
                  className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white h-32 w-full"
                  placeholder="Describe the category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Set Status</Label>
                <div className="flex items-center">
                  <Switch
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(checked)}
                    className="mr-2"
                    disabled={isSubmitting}
                  />
                  <Label className="text-white/80">
                    {isActive ? "Active" : "Inactive"}
                  </Label>
                </div>
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
                {isSubmitting ? "Adding..." : "Add Category"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddCategoryForm;
