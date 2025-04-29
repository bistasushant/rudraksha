import {
  AddBlogRequest,
  AddCategoryRequest,
  AddProductRequest,
  ChangeEmailRequest,
  ChangePasswordRequest,
  ChangeImageRequest,
  LoginRequest,
  RegisterRequest,
  UpdateCategoryRequest,
  UpdateProductRequest,
  RegisterCustomerRequest,
  AddBlogCategoryRequest,
  UpdateBlogCategoryRequest,
  UpdateBlogRequest,
  UserRole,
} from "@/types";
import sanitizeHtml from "sanitize-html";

// Role hierarchy definition
const ROLES_HIERARCHY: UserRole[] = ["user", "editor", "admin", "customer"];

export const validateRole = (role: string, requiredRole: UserRole): boolean => {
  const userRoleIndex = ROLES_HIERARCHY.indexOf(role.toLowerCase() as UserRole);
  const requiredRoleIndex = ROLES_HIERARCHY.indexOf(requiredRole);
  return userRoleIndex >= requiredRoleIndex && userRoleIndex !== -1;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return passwordRegex.test(password);
};

export const validateName = (name: string): boolean => {
  return typeof name === "string" && name.trim().length > 0;
};

export function validateImage(image: string): boolean {
  if (!image || typeof image !== "string") {
    return false;
  }
  const urlPattern = /^(https?:\/\/)/i;
  const base64Pattern = /^data:image\/(png|jpeg|jpg|gif);base64,/i;
  return urlPattern.test(image) || base64Pattern.test(image);
}
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone);
};

export function sanitizeInput(input: string) {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

// Authentication requests (no role needed)
export const validateLoginRequest = (data: unknown): data is LoginRequest => {
  if (!data || typeof data !== "object") return false;
  const loginData = data as Partial<LoginRequest>;
  return (
    typeof loginData.email === "string" &&
    typeof loginData.password === "string" &&
    validateEmail(loginData.email)
  );
};

export const validateRegisterRequest = (
  data: unknown
): data is RegisterRequest => {
  if (!data || typeof data !== "object") return false;
  const registerData = data as Partial<RegisterRequest>;
  return (
    typeof registerData.email === "string" &&
    typeof registerData.name === "string" &&
    typeof registerData.password === "string" &&
    typeof registerData.confirmPassword === "string" &&
    typeof registerData.role === "string" &&
    ["admin", "editor", "user", "customer"].includes(registerData.role) &&
    validateEmail(registerData.email) &&
    validateName(registerData.name) &&
    validatePassword(registerData.password) &&
    registerData.password === registerData.confirmPassword &&
    (registerData.role !== "customer" ||
      (typeof registerData.contactNumber === "string" &&
        registerData.contactNumber.trim().length > 0))
  );
};

export const validateChangeEmailRequest = (
  data: unknown
): data is ChangeEmailRequest => {
  if (!data || typeof data !== "object") return false;
  const emailData = data as Partial<ChangeEmailRequest>;
  return (
    typeof emailData.newEmail === "string" && validateEmail(emailData.newEmail)
  );
};

export const validateChangePasswordRequest = (
  data: unknown,
  role: string
): data is ChangePasswordRequest => {
  if (!validateRole(role, "user")) return false;
  if (!data || typeof data !== "object") return false;
  const passwordData = data as Partial<ChangePasswordRequest>;
  return (
    typeof passwordData.oldPassword === "string" &&
    typeof passwordData.newPassword === "string" &&
    validatePassword(passwordData.newPassword)
  );
};

export const validateChangeImageRequest = (
  data: unknown,
  role: string
): data is ChangeImageRequest => {
  if (!validateRole(role, "user")) return false;
  if (!data || typeof data !== "object") return false;
  const imageData = data as Partial<ChangeImageRequest>;
  return (
    typeof imageData.newImage === "string" && validateImage(imageData.newImage)
  );
};

// Product management
export const validateAddProductRequest = (
  data: unknown,
  role: string
): data is AddProductRequest => {
  // RBAC: Only admin and editor can add products
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const productData = data as Partial<AddProductRequest>;

  return (
    typeof productData.name === "string" &&
    validateName(productData.name) &&
    (productData.slug === undefined ||
      (typeof productData.slug === "string" &&
        validateSlug(productData.slug))) &&
    Array.isArray(productData.category) &&
    productData.category.every((cat) => typeof cat === "string") &&
    typeof productData.price === "number" &&
    productData.price >= 0 &&
    typeof productData.stock === "number" &&
    productData.stock >= 0 &&
    Number.isInteger(productData.stock) &&
    (productData.description === undefined ||
      typeof productData.description === "string") &&
    (productData.benefit === undefined ||
      typeof productData.benefit === "string") &&
    (productData.images === undefined ||
      (Array.isArray(productData.images) &&
        productData.images.every(
          (img) => typeof img === "string" && validateImage(img)
        )))
  );
};

export const validateUpdateProductRequest = (
  data: unknown,
  role: string
): data is UpdateProductRequest => {
  // RBAC: Only admin and editor can update products
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const productData = data as Partial<UpdateProductRequest>;

  if (
    productData.name === undefined &&
    productData.slug === undefined &&
    productData.category === undefined &&
    productData.price === undefined &&
    productData.stock === undefined &&
    productData.description === undefined &&
    productData.benefit === undefined &&
    productData.images === undefined
  ) {
    return false; // At least one field must be provided
  }

  return (
    (productData.name === undefined ||
      (typeof productData.name === "string" &&
        validateName(productData.name))) &&
    (productData.slug === undefined ||
      (typeof productData.slug === "string" &&
        validateSlug(productData.slug))) &&
    (productData.category === undefined ||
      (Array.isArray(productData.category) &&
        productData.category.every((cat) => typeof cat === "string"))) &&
    (productData.price === undefined ||
      (typeof productData.price === "number" && productData.price >= 0)) &&
    (productData.stock === undefined ||
      (typeof productData.stock === "number" &&
        productData.stock >= 0 &&
        Number.isInteger(productData.stock))) &&
    (productData.description === undefined ||
      typeof productData.description === "string") &&
    (productData.benefit === undefined ||
      typeof productData.benefit === "string") &&
    (productData.images === undefined ||
      (Array.isArray(productData.images) &&
        productData.images.every(
          (img) => typeof img === "string" && validateImage(img)
        )))
  );
};

// Category management
export const validateAddCategoryRequest = (
  data: unknown,
  role: string
): data is AddCategoryRequest => {
  // RBAC: Only admin and editor can add categories
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const categoryData = data as Partial<AddCategoryRequest>;

  return (
    typeof categoryData.name === "string" &&
    validateName(categoryData.name) &&
    typeof categoryData.slug === "string" &&
    validateSlug(categoryData.slug) &&
    (categoryData.description === undefined ||
      typeof categoryData.description === "string") &&
    (categoryData.isActive === undefined ||
      typeof categoryData.isActive === "boolean")
  );
};

export const validateUpdateCategoryRequest = (
  data: unknown,
  role: string
): data is UpdateCategoryRequest => {
  // RBAC: Only admin and editor can update categories
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const categoryData = data as Partial<UpdateCategoryRequest>;

  if (
    categoryData.name === undefined &&
    categoryData.slug === undefined &&
    categoryData.description === undefined &&
    categoryData.isActive === undefined
  ) {
    return false; // At least one field must be provided
  }

  return (
    (categoryData.name === undefined ||
      (typeof categoryData.name === "string" &&
        validateName(categoryData.name))) &&
    (categoryData.slug === undefined ||
      (typeof categoryData.slug === "string" &&
        validateSlug(categoryData.slug))) &&
    (categoryData.description === undefined ||
      typeof categoryData.description === "string") &&
    (categoryData.isActive === undefined ||
      typeof categoryData.isActive === "boolean")
  );
};

// Blog management
export const validateAddBlogRequest = (
  data: unknown,
  role: string
): data is AddBlogRequest => {
  // RBAC: Only admin and editor can add blogs
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const blogData = data as Partial<AddBlogRequest>;

  return (
    typeof blogData.name === "string" &&
    validateName(blogData.name) &&
    (blogData.slug === undefined ||
      (typeof blogData.slug === "string" && validateSlug(blogData.slug))) &&
    typeof blogData.heading === "string" &&
    blogData.heading.trim().length > 0 &&
    Array.isArray(blogData.category) &&
    blogData.category.every((cat) => typeof cat === "string") &&
    typeof blogData.description === "string" &&
    blogData.description.trim().length > 0 &&
    (blogData.image === undefined ||
      (typeof blogData.image === "string" && validateImage(blogData.image)))
  );
};

export const validateUpdateBlogRequest = (
  data: unknown,
  role: string
): data is UpdateBlogRequest => {
  // RBAC: Only admin and editor can update blogs
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const blogData = data as Partial<UpdateBlogRequest>;

  if (
    blogData.name === undefined &&
    blogData.slug === undefined &&
    blogData.heading === undefined &&
    blogData.category === undefined &&
    blogData.description === undefined &&
    blogData.image === undefined
  ) {
    return false; // At least one field must be provided
  }

  return (
    (blogData.name === undefined ||
      (typeof blogData.name === "string" && validateName(blogData.name))) &&
    (blogData.slug === undefined ||
      (typeof blogData.slug === "string" && validateSlug(blogData.slug))) &&
    (blogData.heading === undefined ||
      (typeof blogData.heading === "string" &&
        blogData.heading.trim().length > 0)) &&
    (blogData.category === undefined ||
      (Array.isArray(blogData.category) &&
        blogData.category.every((cat) => typeof cat === "string"))) &&
    (blogData.description === undefined ||
      (typeof blogData.description === "string" &&
        blogData.description.trim().length > 0)) &&
    (blogData.image === undefined ||
      (typeof blogData.image === "string" && validateImage(blogData.image)))
  );
};

// Delete validation functions
export const validateDeleteProductRequest = (
  data: unknown,
  role: string
): boolean => {
  // RBAC: Only admin can delete products
  if (!validateRole(role, "admin")) return false;
  if (!data || typeof data !== "object") return false;
  const deleteData = data as Partial<{ id: string }>;
  return typeof deleteData.id === "string" && deleteData.id.trim().length > 0;
};

export const validateDeleteCategoryRequest = (
  data: unknown,
  role: string
): boolean => {
  // RBAC: Only admin can delete categories
  if (!validateRole(role, "admin")) return false;
  if (!data || typeof data !== "object") return false;
  const deleteData = data as Partial<{ id: string }>;
  return typeof deleteData.id === "string" && deleteData.id.trim().length > 0;
};

export const validateDeleteBlogRequest = (
  data: unknown,
  role: string
): boolean => {
  // RBAC: Only admin can delete blogs
  if (!validateRole(role, "admin")) return false;
  if (!data || typeof data !== "object") return false;
  const deleteData = data as Partial<{ id: string }>;
  return typeof deleteData.id === "string" && deleteData.id.trim().length > 0;
};

export const validateSlug = (slug: string): boolean => {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return typeof slug === "string" && slugRegex.test(slug);
};
export const validateRegisterCustomerRequest = (
  data: unknown
): data is RegisterCustomerRequest => {
  if (!data || typeof data !== "object") return false;
  const customerData = data as Partial<RegisterCustomerRequest>;

  return (
    typeof customerData.email === "string" &&
    validateEmail(customerData.email) &&
    typeof customerData.name === "string" &&
    validateName(customerData.name) &&
    typeof customerData.password === "string" &&
    validatePassword(customerData.password) &&
    typeof customerData.confirmPassword === "string" &&
    customerData.password === customerData.confirmPassword &&
    typeof customerData.contactNumber === "string" &&
    validatePhone(customerData.contactNumber) &&
    (customerData.image === undefined || validateImage(customerData.image))
  );
};

export const validateAddBlogCategoryRequest = (
  data: unknown,
  role: string
): data is AddBlogCategoryRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const blogCategoryData = data as Partial<AddBlogCategoryRequest>;

  return (
    typeof blogCategoryData.name === "string" &&
    validateName(blogCategoryData.name) &&
    typeof blogCategoryData.slug === "string"
  );
};

export const validateUpdateBlogCategoryRequest = (
  data: unknown,
  role: string
): data is UpdateBlogCategoryRequest => {
  if (!validateRole(role, "editor")) return false;
  if (!data || typeof data !== "object") return false;
  const blogCategoryData = data as Partial<UpdateBlogCategoryRequest>;
  if (
    blogCategoryData.name === undefined &&
    blogCategoryData.slug === undefined
  ) {
    return false;
  }
  return (
    (blogCategoryData.name === undefined ||
      (typeof blogCategoryData.name === "string" &&
        validateName(blogCategoryData.name))) &&
    (blogCategoryData.slug === undefined ||
      (typeof blogCategoryData.slug === "string" &&
        validateSlug(blogCategoryData.slug)))
  );
};
