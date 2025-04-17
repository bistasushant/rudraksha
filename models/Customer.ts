import mongoose, { Schema } from "mongoose";

const CustomerSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  userName: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "customer",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);
