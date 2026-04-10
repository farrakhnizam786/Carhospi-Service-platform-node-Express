const Booking = require("../Module/Booking");
const Service = require("../Module/Service");

const createBooking = async (req, res) => {
  try {
    const {
      serviceId,
      bookingDate,
      timeSlot,
      vehicleType,
      vehicleNumber,
      description,
    } = req.body;
    const userId = req.session.user.id;

    if (
      !serviceId ||
      !bookingDate ||
      !timeSlot ||
      !vehicleType ||
      !vehicleNumber
    ) {
      return res.status(400).json({
        error: "All required fields are missing",
      });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const booking = await Booking.create({
      user: userId,
      service: serviceId,
      serviceDetails: {
        name: service.name,
        price: "TBD",
      },
      bookingDate,
      timeSlot,
      vehicleType,
      vehicleNumber,
      description,
    });

    return res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create booking",
    });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const bookings = await Booking.find({ user: userId })
      .populate("service", "name description image")
      .sort({ createdAt: -1 });

    return res.render("user/bookings", { bookings, user: req.session.user });
  } catch (error) {
    return res.render("user/bookings", {
      bookings: [],
      error: "Failed to load bookings",
      user: req.session.user,
    });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate("service", "name")
      .sort({ createdAt: -1 });

    return res.json(bookings);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to load bookings",
    });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!["pending", "approved", "in-service", "rejected", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const booking = await Booking.findByIdAndUpdate(
      id,
      { status, adminNotes },
      { returnDocument: "after" },
    );

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    return res.json({
      message: "Booking updated successfully",
      booking,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update booking",
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.user.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (booking.status !== "pending") {
      return res
        .status(400)
        .json({ error: "Can only cancel pending bookings" });
    }

    await Booking.findByIdAndDelete(id);

    return res.json({
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to cancel booking",
    });
  }
};

const addFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.session.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Invalid rating" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (booking.user.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (booking.status !== "completed") {
      return res.status(400).json({ error: "Can only rate completed bookings" });
    }

    booking.rating = rating;
    booking.feedback = feedback;
    await booking.save();

    return res.json({
      message: "Feedback submitted successfully",
      booking,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to submit feedback",
    });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
  addFeedback,
};
