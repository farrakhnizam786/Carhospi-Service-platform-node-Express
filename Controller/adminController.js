const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Admin = require("../Module/Admin");
const Service = require("../Module/Service");
const Settings = require("../Module/Settings");

const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
const DEFAULT_DURATION = 60 * 60 * 1000; // 1 hour

const getLoginPage = (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }

  res.render("admin/login", { error: null, success: null });
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const cookieMaxAge = rememberMe ? REMEMBER_ME_DURATION : DEFAULT_DURATION;
    const tokenExpiry = rememberMe ? "30d" : "1h";

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).render("admin/login", {
        error: "Invalid credentials",
        success: null,
      });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return res.status(401).render("admin/login", {
        error: "Invalid credentials",
        success: null,
      });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry },
    );

    req.session.admin = {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    // Extend session cookie if remember me is checked
    if (rememberMe) {
      req.session.cookie.maxAge = REMEMBER_ME_DURATION;
    }

    res.cookie("adminToken", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: cookieMaxAge,
    });

    return res.redirect("/admin/dashboard");
  } catch (error) {
    return res.status(500).render("admin/login", {
      error: "Something went wrong",
      success: null,
    });
  }
};

const getDashboard = async (req, res) => {
  try {
    const services = await Service.find({ addedBy: req.admin.id }).populate(
      "addedBy",
      "name email",
    );
    return res.render("admin/dashboard", {
      admin: req.session.admin,
      services,
    });
  } catch (error) {
    return res.render("admin/dashboard", {
      admin: req.session.admin,
      services: [],
      error: "Failed to load services",
    });
  }
};

const logoutAdmin = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("adminToken");
    return res.redirect("/admin/login");
  });
};

const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ error: "Failed to load settings" });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { contactPhone, contactEmail, contactAddress } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    settings.contactPhone = contactPhone;
    settings.contactEmail = contactEmail;
    settings.contactAddress = contactAddress;
    await settings.save();
    return res.json({ message: "Settings updated successfully", settings });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update settings" });
  }
};

// ── Forgot Password ────────────────────────────────────────────────
const getForgotPasswordPage = (req, res) => {
  res.render("admin/forgot-password", { error: null, success: null });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.render("admin/forgot-password", {
        error: "No admin account found with that email address.",
        success: null,
      });
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

    admin.resetToken = resetToken;
    admin.resetTokenExpiry = resetTokenExpiry;
    await admin.save();

    // In production, you would send this via email.
    const resetUrl = `${req.protocol}://${req.get("host")}/admin/reset-password/${resetToken}`;
    console.log(`\n🔑 Admin Password Reset Link for ${email}:\n   ${resetUrl}\n`);

    return res.render("admin/forgot-password", {
      error: null,
      success:
        "If an admin account with that email exists, a password reset link has been sent. Check your console/email.",
    });
  } catch (error) {
    return res.render("admin/forgot-password", {
      error: "Something went wrong. Please try again.",
      success: null,
    });
  }
};

const getResetPasswordPage = async (req, res) => {
  try {
    const { token } = req.params;

    const admin = await Admin.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!admin) {
      return res.render("admin/forgot-password", {
        error: "Invalid or expired reset link. Please request a new one.",
        success: null,
      });
    }

    return res.render("admin/reset-password", { token, error: null });
  } catch (error) {
    return res.render("admin/forgot-password", {
      error: "Something went wrong. Please try again.",
      success: null,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.render("admin/reset-password", {
        token,
        error: "Passwords do not match.",
      });
    }

    if (password.length < 6) {
      return res.render("admin/reset-password", {
        token,
        error: "Password must be at least 6 characters.",
      });
    }

    const admin = await Admin.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!admin) {
      return res.render("admin/forgot-password", {
        error: "Invalid or expired reset link. Please request a new one.",
        success: null,
      });
    }

    admin.password = await bcrypt.hash(password, 10);
    admin.resetToken = null;
    admin.resetTokenExpiry = null;
    await admin.save();

    return res.render("admin/login", {
      error: null,
      success: "Password reset successfully! You can now login with your new password.",
    });
  } catch (error) {
    return res.render("admin/forgot-password", {
      error: "Something went wrong. Please try again.",
      success: null,
    });
  }
};

module.exports = {
  getLoginPage,
  loginAdmin,
  getDashboard,
  logoutAdmin,
  getSettings,
  updateSettings,
  getForgotPasswordPage,
  forgotPassword,
  getResetPasswordPage,
  resetPassword,
};
