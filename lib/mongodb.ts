import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Admin from "@/models/Admin"; // Adjust the import path as necessary

const MONGODB_URI = process.env.MONGODB_URI || "";

// Validate MONGODB_URI
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is missing in environment variable");
}

// Database connection function
export const connectDB = async () => {
  // Check if already connected
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);

    // Check if there is any admin with role "admin"
    const existingAdminWithRole = await Admin.findOne({ role: "admin" });

    // Create default admin only if no admin with role "admin" exists
    if (!existingAdminWithRole) {
      // Also check if email exists to avoid duplicate key error
      const emailExists = await Admin.findOne({ email: "admin@gmail.com" });

      if (!emailExists) {
        const hashedPassword = await bcrypt.hash("Admin@123", 10);
        const defaultAdmin = new Admin({
          email: "admin@gmail.com",
          password: hashedPassword,
          name: "Admin",
          role: "admin",
        });

        await defaultAdmin.save();
        console.log("Default admin created with email: admin@gmail.com");
      } else {
        console.log(
          "Email admin@gmail.com already exists in database with a different role"
        );
      }
    } else {
      console.log("Admin with role 'admin' already exists");
    }
  } catch (error) {
    console.error("Error connecting to the database or creating admin:", error);
  }
};
