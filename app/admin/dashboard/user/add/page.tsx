"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { AdminRole } from "@/types";

const AddUserForm = () => {
  const router = useRouter();
  const { admin } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [contactNumber, setcontactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AdminRole>("user");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const roles: AdminRole[] = ["admin", "editor", "user"];

  const handleRoleSelect = (role: AdminRole) => {
    setSelectedRole(role);
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!admin?.token) {
        toast.error("Please log in to add users");
        router.push("/admin");
        return;
      }

      if (admin.role !== "admin") {
        toast.error("Only admins can add users");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Password and confirm password must match");
        return;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify({
          email,
          name,
          contactNumber,
          password,
          confirmPassword,
          role: selectedRole,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to add user");
      }

      toast.success(data.message || "User added successfully");
      router.push("/admin/dashboard/user");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add user"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <h1 className="text-2xl font-bold text-white mb-4">Add New User</h1>
      <Card className="bg-gradient-to-br from-slate-950 to-indigo-950 border border-white/40 max-w-3xl mx-auto">
        <CardHeader>
          <h2 className="text-lg font-bold text-white">User Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2 relative">
                <Label className="text-white/80">Select Role</Label>
                <button
                  type="button"
                  className="flex items-center justify-between w-full bg-white/5 border-white/20 focus:ring-2 focus:ring-gray-500 text-white rounded-lg px-4 py-2"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isSubmitting}
                >
                  <span className="text-white">
                    {selectedRole
                      ? selectedRole.charAt(0).toUpperCase() +
                        selectedRole.slice(1)
                      : "Select role"}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-white/50 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-slate-900 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {roles.length > 0 ? (
                      roles.map((role) => (
                        <div
                          key={role}
                          className={`px-4 py-2 cursor-pointer hover:bg-white text-white hover:text-gray-900/90 flex items-center justify-between ${
                            selectedRole === role ? "bg-purple-600/70" : ""
                          }`}
                          onClick={() => handleRoleSelect(role)}
                        >
                          <span>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </span>
                          {selectedRole === role && (
                            <span className="text-green-400">✓</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-white/70">
                        No roles available
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">User Name</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white w-full"
                  placeholder="Enter user name"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white w-full"
                  placeholder="Enter email"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Phone Number</Label>
                <Input
                  type="phone"
                  value={contactNumber}
                  onChange={(e) => setcontactNumber(e.target.value)}
                  className="bg-white/5 border-white/20 focus:ring-2 focus:ring-purple-500 text-white w-full"
                  placeholder="Enter phone number"
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Password</Label>
                <div className="relative lg:w-full">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white pr-10"
                    placeholder="Enter password"
                    required
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
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white pr-10"
                    placeholder="Confirm password"
                    required
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
                {isSubmitting ? "Adding..." : "Add User"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddUserForm;
