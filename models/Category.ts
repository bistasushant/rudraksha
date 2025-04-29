import { ICategory } from "@/types";
import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);
const Category =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", categorySchema);

async function getCategoriesPaginated(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const categories = await Category.find().skip(skip).limit(limit);
    const total = await Category.countDocuments();
    return {
      error: false,
      data: categories,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return {
      error: true,
      message: "Error fetching categories",
    };
  }
}

export { Category, getCategoriesPaginated };
