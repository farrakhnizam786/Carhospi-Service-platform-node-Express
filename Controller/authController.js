const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../Module/User");

const REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
const DEFAULT_DURATION = 60 * 60 * 1000; // 1 hour

const getLoginPage = (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }

  return res.render("auth/login", { error: null, success: null });
};

const getSignupPage = (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }

  return res.render("auth/signup", { error: null });
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).render("auth/signup", {
        error: "All fields are required",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).render("auth/signup", {
        error: "User already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    res.cookie("userToken", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.redirect("/");
  } catch (error) {
    return res.status(500).render("auth/signup", {
      error: "Something went wrong",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const isJsonRequest = req.is("json");
    const cookieMaxAge = rememberMe ? REMEMBER_ME_DURATION : DEFAULT_DURATION;
    const tokenExpiry = rememberMe ? "30d" : "1h";

    const user = await User.findOne({ email });
    if (!user) {
      if (isJsonRequest) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }
      return res.status(401).render("auth/login", {
        error: "Invalid email or password",
        success: null,
      });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      if (isJsonRequest) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }
      return res.status(401).render("auth/login", {
        error: "Invalid email or password",
        success: null,
      });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry },
    );

    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    // Extend session cookie if remember me is checked
    if (rememberMe) {
      req.session.cookie.maxAge = REMEMBER_ME_DURATION;
    }

    res.cookie("userToken", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: cookieMaxAge,
    });

    if (isJsonRequest) {
      return res.status(200).json({ message: "Login successful" });
    }
    return res.redirect("/");
  } catch (error) {
    if (req.is("json")) {
      return res.status(500).json({
        error: "Something went wrong",
      });
    }
    return res.status(500).render("auth/login", {
      error: "Something went wrong",
      success: null,
    });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("userToken");
    return res.redirect("/login");
  });
};

// ── Forgot Password ────────────────────────────────────────────────
const getForgotPasswordPage = (req, res) => {
  res.render("auth/forgot-password", { error: null, success: null });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.render("auth/forgot-password", {
        error: "No account found with that email address.",
        success: null,
      });
    }

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();

    // In production, you would send this via email.
    // For now, we log the link to the console.
    const resetUrl = `${req.protocol}://${req.get("host")}/reset-password/${resetToken}`;
    console.log(`\n🔑 Password Reset Link for ${email}:\n   ${resetUrl}\n`);

    return res.render("auth/forgot-password", {
      error: null,
      success:
        "If an account with that email exists, a password reset link has been sent. Check your console/email.",
    });
  } catch (error) {
    return res.render("auth/forgot-password", {
      error: "Something went wrong. Please try again.",
      success: null,
    });
  }
};

const getResetPasswordPage = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.render("auth/forgot-password", {
        error: "Invalid or expired reset link. Please request a new one.",
        success: null,
      });
    }

    return res.render("auth/reset-password", { token, error: null });
  } catch (error) {
    return res.render("auth/forgot-password", {
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
      return res.render("auth/reset-password", {
        token,
        error: "Passwords do not match.",
      });
    }

    if (password.length < 6) {
      return res.render("auth/reset-password", {
        token,
        error: "Password must be at least 6 characters.",
      });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.render("auth/forgot-password", {
        error: "Invalid or expired reset link. Please request a new one.",
        success: null,
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.render("auth/login", {
      error: null,
      success: "Password reset successfully! You can now login with your new password.",
    });
  } catch (error) {
    return res.render("auth/forgot-password", {
      error: "Something went wrong. Please try again.",
      success: null,
    });
  }
};

module.exports = {
  getLoginPage,
  getSignupPage,
  signup,
  login,
  logout,
  getForgotPasswordPage,
  forgotPassword,
  getResetPasswordPage,
  resetPassword,
};
