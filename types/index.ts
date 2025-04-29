import { Types, Document } from "mongoose";

export type AdminRole = "admin" | "editor" | "user";
export type CustomerRole = "customer";
export type UserRole = AdminRole | CustomerRole;

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  name: string;
  contactNumber: string;
  image?: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface Customer {
  id: string;
  name: string;
  email: string;
  contactNumber: string;
  image: string;
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
  role: UserRole;
  contactNumber?: string;
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
export interface CustomerApiResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
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
  role: UserRole;
  contactNumber?: string;
}

export interface RegisterResponseData {
  email: string;
  name: string;
  role: UserRole;
  contactNumber?: string;
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
  category: Types.ObjectId[] | string[];
  description: string;
  image: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddBlogRequest {
  name: string;
  slug?: string;
  heading: string;
  category: string[];
  description: string;
  image: string;
}

export interface UpdateBlogRequest {
  name?: string;
  slug?: string;
  heading?: string;
  category?: string[];
  description?: string;
  image?: string;
}

export interface ILogo {
  url: string;
  createdAt?: Date;
}

export interface ITitle {
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IGoogleAnalytics {
  trackingId: string;
  updatedAt?: Date;
}
export interface ICurrency {
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface ISettings extends Document {
  googleAnalytics?: IGoogleAnalytics;
  logo?: ILogo;
  currency?: ICurrency;
  title?: ITitle;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface UpdateSettingsRequest {
  googleAnalytics?: { trackingId: string };
  logo?: { url: string };
  currency?: { currency: string };
  title?: { title: string };
}
export interface SettingsResponseData {
  googleAnalytics?: IGoogleAnalytics;
  logo?: ILogo;
  currency?: ICurrency;
  title?: ITitle;
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

export interface CustomerLoginResponseData {
  token: string;
  email: string;
  name: string;
  image?: string;
  contactNumber: string; // Required for customers
  role: CustomerRole; // Role for customers will be 'customer'
}

// Define the Response Data Interface for Customer Registration
export interface CustomerRegisterResponseData {
  email: string;
  name: string;
  contactNumber: string; // Required for customers
  role: CustomerRole; // Always "customer"
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
  name: string;
  contactNumber: string;
  image?: string;
}

export interface IBlogcategory {
  id?: string;
  slug: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface AddBlogCategoryRequest {
  name: string;
  slug: string;
}
export interface UpdateBlogCategoryRequest {
  name?: string;
  slug?: string;
}

export interface CartItem {
  productId: Types.ObjectId;
  name?: string;
  image?: string;
  price?: number;
  quantity: number;
}

export interface ICart extends Document {
  customerId?: Types.ObjectId;
  sessionId?: string;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
}
