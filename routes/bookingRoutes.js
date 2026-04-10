const express = require("express");
const {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
  addFeedback,
} = require("../Controller/bookingController");
const { requireUserAuth } = require("../Middleware/requireUserAuth");
const { verifyAdmin } = require("../Middleware/adminAuth");

const router = express.Router();

// User routes
router.post("/", requireUserAuth, createBooking);
router.get("/my-bookings", requireUserAuth, getUserBookings);
router.delete("/:id", requireUserAuth, cancelBooking);
router.put("/:id/feedback", requireUserAuth, addFeedback);

// Admin routes
router.get("/admin/all", verifyAdmin, getAllBookings);
router.put("/:id/status", verifyAdmin, updateBookingStatus);

module.exports = router;
