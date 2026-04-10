const express = require("express");
const {
  getLoginPage,
  getSignupPage,
  signup,
  login,
  logout,
} = require("../Controller/authController");

const router = express.Router();

router.get("/login", getLoginPage);
router.get("/signup", getSignupPage);
router.get("/signin", getSignupPage);
router.post("/signup", signup);
router.post("/signin", signup);
router.post("/login", login);
router.post("/logout", logout);

module.exports = router;
