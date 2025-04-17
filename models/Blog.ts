import { IBlog } from "@/types";
import mongoose, { Schema } from "mongoose";

const blogSchema = new Schema<IBlog>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    heading: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);
const Blog = mongoose.models.Blog || mongoose.model<IBlog>("Blog", blogSchema);

async function getBlogsPaginated(page = 1, limit = 10) {
  try {
    const skip = (page - 1) * limit;
    const blogs = await Blog.find().skip(skip).limit(limit);
    const total = await Blog.countDocuments();
    return {
      error: false,
      data: blogs,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return {
      error: true,
      message: "Error fetching blogs",
    };
  }
}

export { Blog, getBlogsPaginated };
