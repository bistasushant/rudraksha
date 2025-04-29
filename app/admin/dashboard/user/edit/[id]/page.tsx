"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { AdminRole, ApiResponse } from "@/types";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  contactNumber: string;
  role: AdminRole;
}

const EditUserPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: "",
    email: "",
    contactNumber: "",
  });
  const [userData, setUserData] = useState<UserProfile>({
    id: "",
    email: "",
    name: "",
    contactNumber: "",
    role: "user" as AdminRole,
  });

  const router = useRouter();
  const params = useParams();
  const userEmail =
    typeof params.id === "string" ? decodeURIComponent(params.id) : "";
  const { admin } = useAuth();
  const roles: AdminRole[] = ["admin", "editor", "user"];

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userEmail || !admin?.token) {
        toast.error("Invalid user email or not authenticated");
        router.push("/admin/dashboard/user");
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/users/profiles?email=${encodeURIComponent(userEmail)}`,
          {
            headers: {
              Authorization: `Bearer ${admin.token}`,
            },
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to fetch user data");
        }

        const data: ApiResponse<UserProfile[]> = await response.json();
        const user = data.data?.find((u) => u.email === userEmail);

        if (!user) {
          throw new Error("User not found");
        }

        setUserData({
          id: user.id,
          email: user.email,
          name: user.name,
          contactNumber: user.contactNumber || "",
          role: user.role,
        });
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to fetch user data"
        );
        router.push("/admin/dashboard/user");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userEmail, admin, router]);

  const validateForm = () => {
    const errors = {
      name: userData.name.trim() ? "" : "Name is required",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)
        ? ""
        : "Invalid email format",
      contactNumber:
        userData.role === "user" && !userData.contactNumber.trim()
          ? "Contact number is required for user role"
          : "",
    };
    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleRoleChange = (role: AdminRole) => {
    setUserData((prev) => ({ ...prev, role }));
    setFormErrors((prev) => ({
      ...prev,
      contactNumber:
        role === "user" && !prev.contactNumber
          ? "Contact number is required for user role"
          : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!admin?.token || admin.role !== "admin") {
      toast.error("Only admins can update user profiles");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix form errors");
      return;
    }

    try {
      setIsSubmitting(true);

      const updateData = {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        contactNumber: userData.contactNumber.trim() || undefined,
        role: userData.role,
      };

      const response = await fetch(`/api/users/${userData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        if (response.status === 400 && data.message?.includes("customer")) {
          toast.error(
            "Cannot update customers here. Use the customer management page."
          );
        } else if (response.status === 409) {
          toast.error("Email already exists");
        } else {
          throw new Error(data.message || "Failed to update user");
        }
        return;
      }

      toast.success("User updated successfully");
      router.push("/admin/dashboard/user");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-indigo-950 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <div className="h-8 bg-white/10 rounded animate-pulse" />
          <div className="h-64 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center mb-4">
        <Button
          type="button"
          variant="secondary"
          className="bg-white/10 hover:bg-white/20 text-white"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-white mb-4">Edit User</h1>
      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-3xl mx-auto">
        <CardHeader>
          <h2 className="text-lg font-bold text-white">User Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-white/80">User Role</Label>
                <Select
                  value={userData.role}
                  onValueChange={handleRoleChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/20 text-white">
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">User Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={userData.name}
                  onChange={handleInputChange}
                  placeholder="Enter user name"
                  className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white"
                  required
                  disabled={isSubmitting}
                />
                {formErrors.name && (
                  <p className="text-red-400 text-sm">{formErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={userData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email"
                  className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white"
                  required
                  disabled={isSubmitting}
                />
                {formErrors.email && (
                  <p className="text-red-400 text-sm">{formErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Contact Number</Label>
                <Input
                  id="contactNumber"
                  name="contactNumber"
                  value={userData.contactNumber}
                  onChange={handleInputChange}
                  placeholder="Enter contact number (required for user role)"
                  className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white"
                  disabled={isSubmitting}
                />
                {formErrors.contactNumber && (
                  <p className="text-red-400 text-sm">
                    {formErrors.contactNumber}
                  </p>
                )}
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
                {isSubmitting ? "Updating..." : "Update User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditUserPage;
