import { Types } from "mongoose";

export type AdminRole = "admin" | "editor" | "user";
export type CustomerRole = "customer";

export interface IAdmin {
  email: string;
  password: string;
  name: string;
  image: string;
  role: AdminRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role?: AdminRole;
}
export interface ChangeEmailRequest {
  newEmail: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ChangeImageRequest {
  newImage: string;
}
export interface ApiResponse<T = any> {
  error: boolean;
  message?: string;
  data?: T;
}
export interface LoginResponseData {
  token: string;
  email: string;
  name: string;
  image?: string;
  role: AdminRole;
}

export interface RegisterResponseData {
  email: string;
  name: string;
  role: AdminRole;
}

export interface IProduct {
  id?: string;
  slug: string;
  name: string;
  category: Types.ObjectId[] | string[];
  price: number;
  stock: number;
  description: string;
  benefit: string;
  images?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddProductRequest {
  name: string;
  slug?: string;
  category: string[];
  price: number;
  stock: number;
  description: string;
  benefit: string;
  images?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  slug?: string;
  category?: string[];
  price?: number;
  stock?: number;
  description?: string;
  benefit?: string;
  images?: string[];
}

export interface ICategory {
  id?: string;
  slug: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean;
}

export interface AddCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  isActive: boolean;
}

export interface PaginationRequest {
  page: number;
  limit: number;
}

export interface PaginationResponse<T> {
  success: boolean;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: T[];
}

export interface IBlog {
  id?: string;
  slug: string;
  name: string;
  heading: string;
  description: string;
  image: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddBlogRequest {
  name: string;
  slug?: string;
  heading: string;
  description: string;
  image: string;
}

export interface UpdateBlogRequest {
  name?: string;
  slug?: string;
  heading?: string;
  description?: string;
  image?: string;
}

export interface ILogo {
  url: string;
  createdAt?: Date;
}

export interface ITitle {
  title: string;
}

export interface IGoogleAnalytics {
  trackingId: string;
  updatedAt?: Date;
}
export interface UpdateGoogleAnalyticsRequest {
  trackingId?: string;
  updatedAt?: Date;
}
export interface IContact {
  email: string;
  phone: string;
  address: string;
  mapEmbedUrl?: string;
}

export interface IAbout {
  title: string;
  description: string;
  imageUrl: string;
}
export interface ICurrency {
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface ICustomer {
  email: string;
  password: string;
  confirmPassword: string;
  userName: string;
  contactNumber: string;
  image?: string;
  role: CustomerRole; // Role remains "customer"
  createdAt?: Date;
  updatedAt?: Date;
}

// Define the Response Data Interface for Customer Login
export interface CustomerLoginResponseData {
  token: string;
  email: string;
  name: string;
  image?: string;
  role: CustomerRole; // Role for customers will be 'customer'
}

// Define the Response Data Interface for Customer Registration
export interface CustomerRegisterResponseData {
  email: string;
  name: string;
  role: CustomerRole; // Role remains "customer"
}

// Define Customer Login Request Interface
export interface CustomerLoginRequest {
  email: string;
  password: string;
}

// Define Customer Registration Request Interface
export interface RegisterCustomerRequest {
  email: string;
  password: string;
  confirmPassword: string;
  userName: string;
  phone: string;
  image?: string;
  role: CustomerRole; // Role remains "customer"
}
