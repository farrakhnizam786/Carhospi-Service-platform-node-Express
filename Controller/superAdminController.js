const bcrypt = require("bcryptjs");
const Admin = require("../Module/Admin");
const Booking = require("../Module/Booking");

const SUPERADMIN_EMAIL = "Nizam1@gmail.com";
const SUPERADMIN_PASSWORD = "123@@123";

const getSuperAdminLogin = (req, res) => {
  if (req.session.superAdmin) {
    return res.redirect("/superadmin/dashboard");
  }
  return res.render("superadmin/login", { error: null });
};

const loginSuperAdmin = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (email !== SUPERADMIN_EMAIL || password !== SUPERADMIN_PASSWORD) {
      return res.status(401).render("superadmin/login", {
        error: "Invalid super admin credentials",
      });
    }

    req.session.superAdmin = {
      email: SUPERADMIN_EMAIL,
      role: "superadmin",
    };

    // Extend session cookie if remember me is checked
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    }

    return res.redirect("/superadmin/dashboard");
  } catch (error) {
    return res.status(500).render("superadmin/login", {
      error: "Something went wrong",
    });
  }
};

const getSuperAdminDashboard = async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });
    const bookingsWithRating = await Booking.find({ status: 'completed', rating: { $exists: true } });
    let totalRating = 0;
    bookingsWithRating.forEach(b => totalRating += b.rating);
    const avgRating = bookingsWithRating.length > 0 ? (totalRating / bookingsWithRating.length).toFixed(1) : "N/A";

    return res.render("superadmin/dashboard", {
      admins,
      avgRating,
      superAdmin: req.session.superAdmin,
      error: null,
      success: null,
    });
  } catch (error) {
    return res.status(500).render("superadmin/dashboard", {
      admins: [],
      avgRating: "N/A",
      superAdmin: req.session.superAdmin,
      error: "Failed to load dashboard data",
      success: null,
    });
  }
};

const createAdminCredentials = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      const admins = await Admin.find().sort({ createdAt: -1 });
      const bookingsWithRating = await Booking.find({ status: 'completed', rating: { $exists: true } });
      let totalRating = 0; bookingsWithRating.forEach(b => totalRating += b.rating);
      const avgRating = bookingsWithRating.length > 0 ? (totalRating / bookingsWithRating.length).toFixed(1) : "N/A";
      return res.status(400).render("superadmin/dashboard", {
        admins,
        avgRating,
        superAdmin: req.session.superAdmin,
        error: "Name, email and password are required",
        success: null,
      });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      const admins = await Admin.find().sort({ createdAt: -1 });
      const bookingsWithRating = await Booking.find({ status: 'completed', rating: { $exists: true } });
      let totalRating = 0; bookingsWithRating.forEach(b => totalRating += b.rating);
      const avgRating = bookingsWithRating.length > 0 ? (totalRating / bookingsWithRating.length).toFixed(1) : "N/A";
      return res.status(400).render("superadmin/dashboard", {
        admins,
        avgRating,
        superAdmin: req.session.superAdmin,
        error: "Admin with this email already exists",
        success: null,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    const admins = await Admin.find().sort({ createdAt: -1 });
    const bookingsWithRating = await Booking.find({ status: 'completed', rating: { $exists: true } });
    let totalRating = 0; bookingsWithRating.forEach(b => totalRating += b.rating);
    const avgRating = bookingsWithRating.length > 0 ? (totalRating / bookingsWithRating.length).toFixed(1) : "N/A";
    return res.render("superadmin/dashboard", {
      admins,
      avgRating,
      superAdmin: req.session.superAdmin,
      error: null,
      success: "Admin credentials generated successfully",
    });
  } catch (error) {
    const admins = await Admin.find().sort({ createdAt: -1 });
    return res.status(500).render("superadmin/dashboard", {
      admins,
      avgRating: "N/A",
      superAdmin: req.session.superAdmin,
      error: "Failed to create admin",
      success: null,
    });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    await Admin.findByIdAndDelete(req.params.id);
    return res.redirect("/superadmin/dashboard");
  } catch (error) {
    return res.redirect("/superadmin/dashboard");
  }
};

const logoutSuperAdmin = (req, res) => {
  req.session.superAdmin = null;
  return res.redirect("/superadmin/login");
};

module.exports = {
  getSuperAdminLogin,
  loginSuperAdmin,
  getSuperAdminDashboard,
  createAdminCredentials,
  deleteAdmin,
  logoutSuperAdmin,
};
