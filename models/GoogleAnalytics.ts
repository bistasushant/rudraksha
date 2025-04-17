import { Schema, model, models, Document } from "mongoose";

export interface IGoogleAnalyticsDocument extends Document {
  trackingId: string;
  updatedAt: Date;
}

const GoogleAnalyticsSchema = new Schema<IGoogleAnalyticsDocument>({
  trackingId: {
    type: String,
    required: true,
    match: /^G-[A-Z0-9]{10}$/, // Ensures format like G-XXXXXXXXXX
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const GoogleAnalyticsModel =
  models.GoogleAnalytics ||
  model<IGoogleAnalyticsDocument>("GoogleAnalytics", GoogleAnalyticsSchema);
