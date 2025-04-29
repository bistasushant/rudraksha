"use client";
import React, { useState } from "react";
import { toast, Toaster } from "sonner";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useRouter } from "next/navigation";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  contactNumber: string;
}

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    contactNumber: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format.";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    // Contact Number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!formData.contactNumber) {
      newErrors.contactNumber = "Contact number is required.";
    } else if (!phoneRegex.test(formData.contactNumber)) {
      newErrors.contactNumber = "Invalid phone number format.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the form errors.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/customer/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Account created successfully! Redirecting to login...");
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          contactNumber: "",
        });
        router.push("/auth/login");
      } else {
        const errorMessage = data.message || "Registration failed.";
        if (response.status === 409) {
          setErrors({ email: "Email already exists." });
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error("Error during registration:", error);
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <>
      <section className="min-h-screen bg-gradient-to-br from-gray-800 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-white mb-2 transform hover:scale-105 transition-all">
              Join Our Community
            </h2>
            <p className="text-indigo-100 font-medium">
              Create your free account now
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:shadow-3xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                        errors.name ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Your Name"
                      disabled={isSubmitting}
                    />
                    <svg
                      className="w-5 h-5 absolute right-3 top-3.5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                        errors.email ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Enter your email"
                      disabled={isSubmitting}
                    />
                    <svg
                      className="w-5 h-5 absolute right-3 top-3.5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative">
                    <label className="block text-md font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type={passwordVisible ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                        errors.password ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Enter your password"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute right-3 top-10 text-gray-400 hover:text-purple-500 transition-colors"
                      disabled={isSubmitting}
                    >
                      {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.password}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <label className="block text-md font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type={confirmPasswordVisible ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                        errors.confirmPassword
                          ? "border-red-500"
                          : "border-gray-200"
                      }`}
                      placeholder="Enter your password again"
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmPasswordVisible(!confirmPasswordVisible)
                      }
                      className="absolute right-3 top-10 text-gray-400 hover:text-purple-500 transition-colors"
                      disabled={isSubmitting}
                    >
                      {confirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-md font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.contactNumber}
                      onChange={(e) =>
                        handleInputChange("contactNumber", e.target.value)
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all ${
                        errors.contactNumber
                          ? "border-red-500"
                          : "border-gray-200"
                      }`}
                      placeholder="Enter your phone number (e.g., +9771234567890)"
                      disabled={isSubmitting}
                    />
                    <svg
                      className="w-5 h-5 absolute right-3 top-3.5 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    {errors.contactNumber && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.contactNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>
            </form>
            <p className="mt-6 text-center text-md text-gray-500">
              Already have an account?{" "}
              <a
                href="/auth/login"
                className="font-medium text-md text-purple-600 hover:underline hover:text-purple-500"
              >
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </section>
      <Toaster position="bottom-right" />
    </>
  );
};

export default RegisterForm;
