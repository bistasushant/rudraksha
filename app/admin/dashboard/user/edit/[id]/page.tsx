"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { AdminRole } from "@/types";

interface UserProfile {
  email: string;
  name: string;
  role: AdminRole;
  image?: string;
}

const EditUserPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userData, setUserData] = useState<UserProfile>({
    email: "",
    name: "",
    role: "user" as AdminRole,
    image: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
        const response = await fetch("/api/admin/profile", {
          headers: {
            Authorization: `Bearer ${admin.token}`,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to fetch user data");
        }

        const data = await response.json();
        const user = data.data.find((u: UserProfile) => u.email === userEmail);

        if (!user) {
          throw new Error("User not found");
        }

        setUserData(user);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role: AdminRole) => {
    setUserData((prev) => ({ ...prev, role }));
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!admin?.token || admin.role !== "admin") {
      toast.error("Only admins can update user profiles");
      return;
    }

    // Validate password and confirmPassword if provided
    if (password && password !== confirmPassword) {
      toast.error("Password and confirm password must match");
      return;
    }

    try {
      setIsSubmitting(true);

      const updateData = {
        targetEmail: userEmail,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        ...(password ? { password, confirmPassword } : {}),
      };

      const response = await fetch("/api/auth/register", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update user");
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
        <p className="text-white">Loading...</p>
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
              <div className="space-y-2 relative">
                <Label className="text-white/80">User Role</Label>
                <button
                  type="button"
                  className="flex items-center justify-between w-full bg-white/5 border-white/20 focus:ring-2 focus:ring-gray-500 text-white rounded-lg px-4 py-2"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isSubmitting}
                >
                  <span>
                    {userData.role.charAt(0).toUpperCase() +
                      userData.role.slice(1)}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-white/50 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {roles.map((role) => (
                      <div
                        key={role}
                        className={`px-4 py-2 cursor-pointer hover:bg-white/10 text-white flex items-center justify-between ${
                          userData.role === role ? "bg-purple-600/70" : ""
                        }`}
                        onClick={() => handleRoleSelect(role)}
                      >
                        <span>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </span>
                        {userData.role === role && (
                          <span className="text-green-400">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Password</Label>
                <div className="relative lg:w-full">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white pr-10"
                    placeholder="Enter new password (optional)"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-white/70 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <AiOutlineEyeInvisible />
                    ) : (
                      <AiOutlineEye />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Confirm Password</Label>
                <div className="relative lg:w-full">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white pr-10"
                    placeholder="Confirm new password (optional)"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-white/70 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <AiOutlineEyeInvisible />
                    ) : (
                      <AiOutlineEye />
                    )}
                  </button>
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
