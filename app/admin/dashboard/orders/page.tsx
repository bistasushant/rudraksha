"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const OrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const ordersData = [
    {
      id: "#ORD-7245",
      customer: "John Doe",
      product: "iPhone 15 Pro",
      date: "Apr 23, 2023",
      amount: "Rs 1,299.00",
      status: "Completed",
    },
    {
      id: "#ORD-7244",
      customer: "Alice Smith",
      product: "MacBook Air M2",
      date: "Apr 22, 2023",
      amount: "Rs 1,199.00",
      status: "Processing",
    },
    {
      id: "#ORD-7243",
      customer: "Robert Johnson",
      product: "AirPods Pro",
      date: "Apr 22, 2023",
      amount: "Rs 249.00",
      status: "Completed",
    },
    {
      id: "#ORD-7242",
      customer: "Emily Wilson",
      product: "iPad Air",
      date: "Apr 21, 2023",
      amount: "Rs 599.00",
      status: "Pending",
    },
    {
      id: "#ORD-7241",
      customer: "Michael Brown",
      product: "Apple Watch Series 8",
      date: "Apr 20, 2023",
      amount: "Rs 399.00",
      status: "Completed",
    },
  ];

  const filteredOrders = ordersData.filter(
    (order) =>
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 mb-6">
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="text-white/70">
          Manage your customer orders efficiently.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-2 text-white/50" />
          <Input
            type="text"
            placeholder="Search by customer or product..."
            className="w-full bg-white/5 border border-white/10 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-2xl">
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-white/70 text-md">
                  Order ID
                </TableHead>
                <TableHead className="text-white/70 text-md">
                  Customer
                </TableHead>
                <TableHead className="text-white/70 text-md">Product</TableHead>
                <TableHead className="text-white/70 text-md">Date</TableHead>
                <TableHead className="text-white/70 text-md">Amount</TableHead>
                <TableHead className="text-white/70 text-md">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order, index) => (
                  <TableRow
                    key={index}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <TableCell className="text-white/70 text-md">
                      {order.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src="/placeholder.svg" alt="Avatar" />
                          <AvatarFallback className="bg-purple-600">
                            JD
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white/70 text-md">
                          {order.customer}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/70 text-md">
                      {order.product}
                    </TableCell>
                    <TableCell className="text-white/70 text-md">
                      {order.date}
                    </TableCell>
                    <TableCell className="text-white/70 text-md">
                      {order.amount}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          order.status === "Completed"
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : order.status === "Processing"
                            ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                            : "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-white/70">
                    No orders found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Pagination className="mt-3">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              className="text-white/60 hover:bg-gray-500/20 hover:text-white/80"
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink
              href="#"
              className="text-white/60 hover:bg-gray-500/20 hover:text-white/80"
            >
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis className="text-white/60 hover:bg-gray-500/20 hover:text-white/80" />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              className="text-white/60 hover:bg-gray-500/20 hover:text-white/80"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default OrdersPage;
