import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    subscribers: {
      type: Schema.Types.ObjectId, //who is subscribed
      ref: "User",
    },
    channel: {
      type: Schema.Types.ObjectId, //who is subscribed
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
