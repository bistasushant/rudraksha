import mongoose, { Schema, Model } from "mongoose";
import { ITitle } from "@/types";

// Define the schema
const titleSchema = new Schema<ITitle>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Create or reuse the model
const Title: Model<ITitle> =
  mongoose.models.Title || mongoose.model<ITitle>("Title", titleSchema);

export default Title;
