"use client";
import { useState } from "react";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

export default function Login() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const loginData = {
        email: email.trim(),
        password,
      };

      // First try admin login
      let response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(loginData),
      });

      // If admin login fails with 401, try customer login
      if (response.status === 401) {
        response = await fetch("/api/customer/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(loginData),
        });
      }

      const contentType = response.headers.get("content-type");
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error("Unexpected server response format: " + text);
      }

      if (response.ok && data?.data?.token) {
        const userData = data.data;

        // Determine account type based on which endpoint succeeded
        const accountType = response.url.includes("customer")
          ? "customer"
          : "admin";

        // Store common data
        localStorage.setItem("token", userData.token);
        localStorage.setItem("username", userData.name || userData.email);
        localStorage.setItem("accountType", accountType);

        // Store role - could be "admin", "editor", "user", or "customer"
        const role =
          userData.role || (accountType === "customer" ? "customer" : "user");
        localStorage.setItem("role", role);

        toast.success("Login Successful!....");

        // Redirect based on role
        setTimeout(() => {
          if (["admin", "editor", "user"].includes(role)) {
            router.push("/");
          } else {
            router.push("/");
          }
        }, 1000);
      } else {
        if (response.status === 401) {
          setError("Invalid email or password.");
        } else {
          setError(data?.message || "Login failed. Please try again.");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Connection error. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section className="min-h-screen bg-gradient-to-br from-gray-800 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-white mb-2 transform hover:scale-105 transition-all">
              Welcome Back
            </h2>
            <p className="text-indigo-100 font-medium">
              Sign in to your account
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:shadow-3xl">
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                <span className="text-red-600 text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2">
                <span className="text-green-600 text-sm">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Enter your email"
                    />
                    <FaEnvelope className="w-5 h-5 absolute right-3 top-3.5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={passwordVisible ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                      placeholder="Enter your password"
                    />
                    <FaLock className="w-5 h-5 absolute right-3 top-3.5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible(!passwordVisible)}
                      className="absolute right-10 top-3.5 text-gray-400 hover:text-purple-500 transition-colors"
                    >
                      {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-lg transition-all duration-300 transform ${
                  isLoading
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:scale-[1.02] active:scale-95"
                }`}
              >
                {isLoading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <p className="mt-6 text-center text-lg text-gray-800">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-purple-600 text-md hover:underline hover:text-purple-500 transition-colors"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </section>
      <Toaster position="bottom-right" />
    </>
  );
}
