"use client";
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/app/admin/providers/AuthProviders";
import { IBlog, IBlogcategory } from "@/types";
import { ArrowUpDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Types } from "mongoose";

const BlogPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [blogData, setBlogData] = useState<IBlog[]>([]);
  const [categories, setCategories] = useState<IBlogcategory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<{
    id: string;
    slug: string;
  } | null>(null);
  const itemsPerPage = 10;
  const router = useRouter();
  const { admin } = useAuth();

  // RBAC Permissions
  const canAddBlog = admin?.role && ["admin", "editor"].includes(admin.role);
  const canEditBlog = admin?.role && ["admin", "editor"].includes(admin.role);
  const canDeleteBlog = admin?.role === "admin";
  const showActionsColumn = canEditBlog || canDeleteBlog;

  const fetchBlogData = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view blogs.");
      router.push("/admin");
      return;
    }

    try {
      setLoading(true);
      const blogsResponse = await fetch(
        `/api/blog?page=${currentPage}&limit=${itemsPerPage}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${admin.token}`,
          },
          cache: "no-store",
        }
      );

      if (!blogsResponse.ok) {
        const errorData = await blogsResponse.json();
        throw new Error(errorData.message || "Failed to fetch blogs");
      }

      const blogsResult = await blogsResponse.json();
      if (blogsResult.error) {
        throw new Error(blogsResult.message);
      }

      setBlogData(blogsResult.data?.blogs || []);
      setCurrentPage(blogsResult.data?.page || 1);
      setTotalPages(blogsResult.data?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load data.",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setLoading(false);
    }
  }, [admin, currentPage, router, itemsPerPage]);

  const fetchData = useCallback(async () => {
    if (!admin?.token) {
      toast.error("Please log in to view blogs.");
      router.push("/admin");
      return;
    }
    try {
      await fetchBlogData();

      const categoriesResponse = await fetch("/api/blogcategory", {
        headers: {
          Authorization: `Bearer ${admin.token}`,
        },
        cache: "no-store",
      });
      if (!categoriesResponse.ok) {
        const errorData = await categoriesResponse.json();
        throw new Error(errorData.message || "Failed to fetch blog categories");
      }
      const categoriesResult = await categoriesResponse.json();

      // Update this line to use the correct property path
      setCategories(categoriesResult.data?.blogCategories || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to load data.",
        {
          description: "Please try again later.",
        }
      );
    }
  }, [admin, router, fetchBlogData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCategoryNames = (categoryIds: Types.ObjectId[] | string[]) => {
    if (!Array.isArray(categoryIds) || categories.length === 0) {
      return "Unknown Blog Category";
    }

    return categoryIds
      .map((categoryId) => {
        const id = categoryId.toString();
        // This is likely where the issue is - we need to check how the ID is stored in your category objects
        const category = categories.find(
          (cat) => cat.id === id || cat.id === id || cat.id?.toString() === id
        );
        return category ? category.name : "Unknown Blog Category";
      })
      .join(", ");
  };

  const filteredBlogs = blogData.filter((blog) =>
    blog.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedBlogs = filteredBlogs.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  });

  const paginatedBlogs = sortedBlogs;

  const handleEdit = (slug: string) => {
    if (!canEditBlog) {
      toast.error("You do not have permission to edit blogs.");
      return;
    }
    router.push(`/admin/dashboard/blog/edit/${slug}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const openDeleteDialog = (blog: { id: string; slug: string }) => {
    if (!canDeleteBlog) {
      toast.error("You do not have permission to delete blogs.");
      return;
    }
    setSelectedBlog(blog);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedBlog || !admin?.token || !canDeleteBlog) {
      toast.error("You do not have permission to delete blogs.");
      setIsDeleteDialogOpen(false);
      return;
    }

    try {
      const response = await fetch(`/api/blog/${selectedBlog.slug}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete blog");
      }
      toast.success("Blog deleted successfully");
      fetchBlogData();
    } catch (error) {
      console.error("Error deleting blog:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete blog",
        {
          description: "Please try again later.",
        }
      );
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedBlog(null);
    }
  };

  const renderSkeletonRows = () =>
    Array.from({ length: itemsPerPage }).map((_, index) => (
      <TableRow key={`skeleton-${index}`} className="border-white/10">
        <TableCell>
          <Skeleton className="h-4 w-8 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8 rounded-full bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </TableCell>
        {showActionsColumn && (
          <TableCell>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 bg-white/10" />
              <Skeleton className="h-8 w-8 bg-white/10" />
            </div>
          </TableCell>
        )}
      </TableRow>
    ));

  return (
    <>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="flex items-center gap-4 w-full md:w-1/3 lg:w-1/4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2 text-white/50" />
              <Input
                type="text"
                placeholder="Search Blog...."
                className="w-full bg-white/5 border border-white/30 rounded-md pl-10 pr-4 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex items-center gap-2 bg-gray-400/20 border hover:bg-gray-900">
                  <span className="font-normal">Sort by Date</span>
                  <ArrowUpDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900/90 text-white">
                <DropdownMenuItem onClick={() => setSortOrder("asc")}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOrder("desc")}>
                  Newest First
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {canAddBlog && (
            <Button
              onClick={() => router.push("/admin/dashboard/blog/add")}
              className="flex items-center gap-2 bg-emerald-600/30 border border-emerald-500 hover:bg-emerald-600/40 mt-4 md:mt-0"
            >
              <Plus size={16} />
              <span className="font-normal">Add Blog</span>
            </Button>
          )}
        </div>

        <Card className="bg-white/5 border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white font-semibold text-2xl">
              Blog List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/10 hover:bg-white/5">
                    <TableHead className="text-white/70 text-md">
                      Blog ID
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Image
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Blog Name
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Slug
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Heading
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Category
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Description
                    </TableHead>
                    <TableHead className="text-white/70 text-md">
                      Date
                    </TableHead>
                    {showActionsColumn && (
                      <TableHead className="text-white/70 text-md">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    renderSkeletonRows()
                  ) : paginatedBlogs.length > 0 ? (
                    paginatedBlogs.map((blog, index) => (
                      <TableRow
                        key={blog.id}
                        className="border-white/10 hover:bg-white/5"
                      >
                        <TableCell className="text-white/70 text-md">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </TableCell>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={blog.image || "image/placeholder.png"}
                              alt="Blog Image"
                            />
                            <AvatarFallback className="bg-purple-600">
                              P
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {blog.name}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {blog.slug}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {blog.heading.length > 20
                            ? `${blog.heading.substring(0, 20)}...`
                            : blog.heading}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {getCategoryNames(blog.category)}
                        </TableCell>

                        <TableCell className="text-white/70 text-md">
                          {blog.description.length > 20
                            ? `${blog.description.substring(0, 20)}...`
                            : blog.description}
                        </TableCell>
                        <TableCell className="text-white/70 text-md">
                          {blog.createdAt
                            ? new Date(blog.createdAt).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        {showActionsColumn && (
                          <TableCell>
                            <div className="flex gap-2">
                              {canEditBlog && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-gray-400/20"
                                  onClick={() =>
                                    blog.slug && handleEdit(blog.slug)
                                  }
                                >
                                  <span className="text-blue-500">
                                    <Pencil />
                                  </span>
                                </Button>
                              )}
                              {canDeleteBlog && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-gray-400/20"
                                  onClick={() =>
                                    blog.id &&
                                    blog.slug &&
                                    openDeleteDialog({
                                      id: blog.id,
                                      slug: blog.slug,
                                    })
                                  }
                                >
                                  <span className="text-red-500">
                                    <Trash2 />
                                  </span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={showActionsColumn ? 8 : 7}
                        className="text-center text-white/70"
                      >
                        No blogs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <Pagination className="mt-3">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${
                    currentPage === 1 ? "pointer-events-none opacity-50" : ""
                  }`}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${
                        currentPage === page
                          ? "bg-emerald-500/20 text-emerald-400"
                          : ""
                      }`}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={`text-white/60 hover:bg-gray-500/20 hover:text-white/80 ${
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : ""
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-gray-900 border border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Blog
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70">
              Are you sure you want to delete this blog? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-white border-none">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BlogPage;
