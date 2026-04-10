const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    serviceDetails: {
      name: String,
      price: String,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
      enum: ["09:00-11:00", "11:00-13:00", "14:00-16:00", "16:00-18:00"],
    },
    vehicleType: {
      type: String,
      required: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
    },
    description: String,
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "approved", "in-service", "rejected", "completed"],
    },
    adminNotes: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Booking", bookingSchema);
