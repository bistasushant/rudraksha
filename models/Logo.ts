import mongoose, { Schema } from "mongoose";
import { ILogo } from "@/types";

const logoSchema = new Schema<ILogo>(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Logo ||
  mongoose.model<ILogo>("Logo", logoSchema);
