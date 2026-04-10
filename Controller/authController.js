const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../Module/User");

const getLoginPage = (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }

  return res.render("auth/login", { error: null });
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
    const { email, password } = req.body;
    const isJsonRequest = req.is("json");

    const user = await User.findOne({ email });
    if (!user) {
      if (isJsonRequest) {
        return res.status(401).json({
          error: "Invalid email or password",
        });
      }
      return res.status(401).render("auth/login", {
        error: "Invalid email or password",
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
      });
    }

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
    });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("userToken");
    return res.redirect("/login");
  });
};

module.exports = {
  getLoginPage,
  getSignupPage,
  signup,
  login,
  logout,
};
