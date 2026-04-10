const express = require("express");
const {
  getLoginPage,
  loginAdmin,
  getDashboard,
  logoutAdmin,
  getSettings,
  updateSettings,
} = require("../Controller/adminController");
const {
  getServicesPage,
  addService,
  deleteService,
} = require("../Controller/serviceController");
const { verifyAdmin } = require("../Middleware/adminAuth");

const router = express.Router();

router.get("/", getLoginPage);
router.get("/login", getLoginPage);
router.post("/login", loginAdmin);
router.get("/dashboard", verifyAdmin, getDashboard);
router.get("/services", verifyAdmin, getServicesPage);
router.post("/services", verifyAdmin, addService);
router.delete("/services/:id", verifyAdmin, deleteService);
router.post("/logout", verifyAdmin, logoutAdmin);
router.get("/bookings", verifyAdmin, (req, res) => {
  return res.render("admin/bookings", { admin: req.session.admin });
});
router.get("/settings", verifyAdmin, getSettings);
router.put("/settings", verifyAdmin, updateSettings);

module.exports = router;
