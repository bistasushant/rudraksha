import mongoose, { Schema, Document } from "mongoose";

// Define the ICurrency interface
export interface ICurrency extends Document {
  currency: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const currencySchema = new Schema<ICurrency>(
  {
    currency: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true } // Automatically manage createdAt and updatedAt fields
);

// Prevent model redefinition in development with hot reloading
const Currency =
  mongoose.models.Currency ||
  mongoose.model<ICurrency>("Currency", currencySchema);
export default Currency;
