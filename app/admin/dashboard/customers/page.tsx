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
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const CustomersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("asc");

  const customersData = [
    {
      id: "#CUST-001",
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      status: "Active",
    },
    {
      id: "#CUST-002",
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "987-654-3210",
      status: "Inactive",
    },
    {
      id: "#CUST-003",
      name: "Alice Johnson",
      email: "alice@example.com",
      phone: "555-555-5555",
      status: "Active",
    },
    {
      id: "#CUST-004",
      name: "Bob Brown",
      email: "bob@example.com",
      phone: "444-444-4444",
      status: "Active",
    },
    {
      id: "#CUST-005",
      name: "Charlie Black",
      email: "charlie@example.com",
      phone: "333-333-3333",
      status: "Inactive",
    },
  ];

  // Define filteredCustomers
  const filteredCustomers = customersData.filter(
    (customer) =>
      (filter === "All" || customer.status === filter) &&
      (customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedCustomers = filteredCustomers.sort((a, b) => {
    if (sortOrder === "asc") {
      return a.name.localeCompare(b.name);
    } else {
      return b.name.localeCompare(a.name);
    }
  });

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2 text-white/50" />
            <Input
              type="text"
              placeholder="Search by customer name or email..."
              className="w-full bg-white/5 border border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 bg-gray-400/20 border hover:bg-gray-900">
                <Filter size={16} />
                <span className="font-normal">Filter</span>
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900/90 text-white">
              <DropdownMenuItem onClick={() => setFilter("All")}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("Active")}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("Inactive")}>
                Inactive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex items-center gap-2 bg-gray-400/20 border hover:bg-gray-900">
                <span className="font-normal">Sort by Name </span>
                <ArrowUpDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900/90 text-white">
              <DropdownMenuItem onClick={() => setSortOrder("asc")}>
                A-Z
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortOrder("desc")}>
                Z-A
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="bg-white/5 border-white/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-2xl">
            Customer List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-white/70 text-md">
                  Customer ID
                </TableHead>
                <TableHead className="text-white/70 text-md">Name</TableHead>
                <TableHead className="text-white/70 text-md">Email</TableHead>
                <TableHead className="text-white/70 text-md">Phone</TableHead>
                <TableHead className="text-white/70 text-md">Status</TableHead>
                <TableHead className="text-white/70 text-md">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCustomers.length > 0 ? (
                sortedCustomers.map((customer, index) => (
                  <TableRow
                    key={index}
                    className="border-white/10 hover:bg-white/5"
                  >
                    <TableCell className="text-white/70 text-md">
                      {customer.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src="/placeholder.svg"
                            alt="Customer Image"
                          />
                          <AvatarFallback className="bg-purple-600">
                            C
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white/70 text-md">
                          {customer.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-white/70 text-md">
                      {customer.email}
                    </TableCell>
                    <TableCell className="text-white/70 text-md">
                      {customer.phone}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          customer.status === "Active"
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        }`}
                      >
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-400/20"
                          onClick={() => {
                            /* Open edit product modal */
                          }}
                        >
                          <span className="text-blue-500">
                            <Pencil />
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-gray-400/20"
                          onClick={() => {
                            /* Handle delete product */
                          }}
                        >
                          <span className="text-red-500">
                            <Trash2 />
                          </span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-white/70">
                    No customers found.
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

export default CustomersPage;
