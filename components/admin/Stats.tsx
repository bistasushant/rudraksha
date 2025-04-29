"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { faRupeeSign } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, ShoppingCart, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const Stats = () => {
  const { admin, isLoading } = useAuth();
  const [displayName, setDisplayName] = useState(admin?.name || "Guest");
  const [productCount, setProductCount] = useState(0);
  const [newProductsCount, setNewProductsCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [newCustomersCount, setNewCustomersCount] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  const fetchProductCount = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view products.");
      setLoadingProducts(false);
      return;
    }
    try {
      setLoadingProducts(true);
      const response = await fetch("/api/products?page=1&limit=1", {
        headers: {
          Authorization: `Bearer ${admin.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch products count");
      }
      const result = await response.json();
      setProductCount(result.data.total || 0);
      setNewProductsCount(result.data.newProductsCount || 0);
    } catch (error) {
      console.error("Error fetching products count:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load products count.",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setLoadingProducts(false);
    }
  }, [admin]);

  const fetchCustomerCount = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view customers.");
      setLoadingCustomers(false);
      return;
    }
    try {
      setLoadingCustomers(true);
      const response = await fetch("/api/customer?page=1&limit=1", {
        headers: {
          Authorization: `Bearer ${admin.token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch customers count");
      }
      const result = await response.json();
      setCustomerCount(result.data?.pagination?.total || 0);
      setNewCustomersCount(result.data?.newCustomersCount || 0); // Use the new field from API
    } catch (error) {
      console.error("Error fetching customers count:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load customers count.",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setLoadingCustomers(false);
    }
  }, [admin]);

  useEffect(() => {
    if (!isLoading && admin) {
      setDisplayName(admin.name);
      fetchProductCount();
      fetchCustomerCount();
    } else if (!isLoading && !admin) {
      setDisplayName("Guest");
      setLoadingProducts(false);
      setLoadingCustomers(false);
    }
  }, [admin, isLoading, fetchProductCount, fetchCustomerCount]);

  return (
    <div className="grid gap-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Dashboard
        </h1>
        <p className="text-white/70">
          Welcome back, {isLoading ? "Loading..." : displayName}! Here&apos;s
          what&apos;s happening with your store today.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/5 border-white/10 shadow-lg hover:shadow-purple-500/10 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-medium text-white/70">
              Total Revenue
            </CardTitle>
            <FontAwesomeIcon
              icon={faRupeeSign}
              className="h-6 w-6 text-purple-400"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-2">Rs 45,231</div>
            <p className="text-sm text-white/70">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 shadow-lg hover:shadow-purple-500/10 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-medium text-white/70">
              Orders
            </CardTitle>
            <ShoppingCart className="h-6 w-6 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-2">+2,350</div>
            <p className="text-sm text-white/70">+12.2% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 shadow-lg hover:shadow-purple-500/10 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-medium text-white/70">
              Products
            </CardTitle>
            <Box className="h-6 w-6 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-2">
              {loadingProducts ? "Loading..." : productCount}
            </div>
            <p className="text-sm text-white/70">
              {loadingProducts
                ? "Loading..."
                : `+${newProductsCount} new this month`}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white/5 border-white/10 shadow-lg hover:shadow-purple-500/10 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg font-medium text-white/70">
              Total Customers
            </CardTitle>
            <Users className="h-6 w-6 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-2">
              {loadingCustomers ? "Loading..." : customerCount}
            </div>
            <p className="text-sm text-white/70">
              {loadingCustomers
                ? "Loading..."
                : `+${newCustomersCount} since last week`}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Stats;
