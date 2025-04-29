"use client";
import React, { useState, useRef, useEffect } from "react";
import { Check, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Image from "next/image";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { useRouter } from "next/navigation";

export default function LogoPage() {
  const [logo, setLogo] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { admin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchLogo = async () => {
      if (!admin?.token) {
        return; // Wait for auth to initialize
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/sitesetting/setting", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        });

        if (response.status === 401) {
          toast.error("Unauthorized access", {
            description: "Please log in again to continue.",
          });
          router.push("/admin");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.error && result.data?.logo?.url) {
          setLogo(result.data.logo.url);
        } else if (result.data === null || !result.data?.logo?.url) {
          setLogo(null);
        } else {
          throw new Error(result.message || "Failed to fetch logo");
        }
      } catch (error) {
        console.error("Error fetching logo:", error);
        toast.error("Failed to load logo", {
          description:
            error instanceof Error ? error.message : "Please try again later",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (admin) {
      fetchLogo();
    }
  }, [admin, router]);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (admin === null) {
      return; // Still loading auth
    }

    if (!admin?.token) {
      toast.error("Please log in to access this page");
      router.push("/admin");
      return;
    }

    if (admin?.role !== "admin") {
      toast.error("Unauthorized", {
        description: "Only administrators can access this page",
      });
      router.push("/admin/dashboard");
    }
  }, [admin, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/svg+xml"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error("Invalid file type", {
        description: "Please upload a PNG, JPEG, or SVG image.",
      });
      return;
    }

    if (file.size > maxSize) {
      toast.error("File too large", {
        description: "Please upload an image smaller than 5MB.",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!admin?.token) {
      toast.error("Authentication required", {
        description: "Please log in to upload logo.",
      });
      router.push("/admin");
      return;
    }

    if (admin.role !== "admin") {
      toast.error("Unauthorized", {
        description: "Only administrators can manage the logo.",
      });
      return;
    }

    if (!preview || !fileInputRef.current?.files?.[0]) {
      toast.error("No image selected", {
        description: "Please select an image to upload.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const file = fileInputRef.current.files[0];
      console.log("Uploading file:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/sitesetting/setting", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${admin.token}`,
        },
        body: formData,
        cache: "no-store",
      });

      console.log("POST response status:", response.status);

      if (response.status === 401) {
        toast.error("Session expired", {
          description: "Please log in again to continue.",
        });
        router.push("/admin");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }

      const result = await response.json();
      console.log("Logo upload result:", result);

      if (!result.error && result.data?.logo?.url) {
        setLogo(result.data.logo.url);
        clearPreview();
        toast.success("Logo updated", {
          description: "Your site logo has been updated successfully.",
        });
      } else {
        throw new Error(result.message || "Failed to upload logo");
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Upload failed", {
        description:
          error instanceof Error ? error.message : "Please try again later.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (!admin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  const headingText = logo ? "Update Site Logo" : "Add Site Logo";
  const buttonText = logo ? "Update Logo" : "Add Logo";

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <ImageIcon className="h-6 w-6 text-purple-400" />
          {headingText}
        </h1>

        <div className="bg-slate-900 border border-white/10 rounded-lg p-6 shadow-xl">
          <div className="mb-6">
            <h2 className="text-md font-medium text-white/70 mb-2">
              Current Logo
            </h2>
            <div className="flex items-center justify-center bg-slate-800 rounded-lg p-8 min-h-32">
              {isLoading ? (
                <Loader2 className="h-6 w-6 text-purple-400 animate-spin" />
              ) : logo ? (
                <Image
                  src={logo}
                  alt="Current logo"
                  width={200}
                  height={80}
                  className="max-h-32 object-contain"
                />
              ) : (
                <p className="text-white/50">No logo set</p>
              )}
            </div>
          </div>

          {admin?.role === "admin" ? (
            <>
              <div className="mb-6">
                <h2 className="text-md font-medium text-white/70 mb-2">
                  Upload New Logo
                </h2>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    className="bg-slate-800 border-white/10 text-white text-md file:text-purple-400 file:mr-4 file:py-1 file:px-4 file:rounded-md file:border-0 file:text-md file:bg-purple-500/20 file:hover:bg-purple-500/30"
                  />
                  {preview && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearPreview}
                      className="text-white/70 hover:text-red-400 hover:bg-white/10"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-white/50 mt-2">
                  Accepted formats: PNG, JPEG, SVG. Maximum size: 5MB.
                </p>
              </div>

              {preview && (
                <div className="mb-6">
                  <h2 className="text-sm font-medium text-white/70 mb-2">
                    Preview
                  </h2>
                  <div className="flex items-center justify-center bg-slate-800 rounded-lg p-8">
                    <Image
                      src={preview}
                      alt="Logo preview"
                      width={200}
                      height={80}
                      className="max-h-32 object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={isUploading || !preview}
                  className="bg-purple-500 hover:bg-purple-600 text-white flex items-center gap-2 disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Check className="h-5 w-5" />
                  )}
                  {buttonText}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-white/50 mb-6">
              Only administrators can upload a new logo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
