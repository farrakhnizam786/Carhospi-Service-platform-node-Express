const express = require("express");
const Service = require("../Module/Service");
const { verifyAdmin } = require("../Middleware/adminAuth");

const router = express.Router();

router.get("/admin/services", verifyAdmin, async (req, res) => {
  try {
    const services = await Service.find().populate("addedBy", "name email");
    return res.json(services);
  } catch (error) {
    return res.status(500).json({ error: "Failed to load services" });
  }
});

module.exports = router;
