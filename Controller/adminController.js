const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../Module/Admin");
const Service = require("../Module/Service");
const Settings = require("../Module/Settings");

const getLoginPage = (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }

  res.render("admin/login", { error: null });
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).render("admin/login", {
        error: "Invalid credentials",
      });
    }

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) {
      return res.status(401).render("admin/login", {
        error: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    req.session.admin = {
      id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    };

    res.cookie("adminToken", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.redirect("/admin/dashboard");
  } catch (error) {
    return res.status(500).render("admin/login", {
      error: "Something went wrong",
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

module.exports = {
  getLoginPage,
  loginAdmin,
  getDashboard,
  logoutAdmin,
  getSettings,
  updateSettings,
};
