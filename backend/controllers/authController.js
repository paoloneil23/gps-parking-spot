const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const normalizeRole = (value) => {
  const role = (value || "user").toString().toLowerCase();
  return role === "admin" ? "admin" : "user";
};

const registerUser = async (req, res) => {
  try {
    const { fullName, username, email, password, adminCode, role: requestedRole } = req.body;
    const normalizedName = (fullName || username || "").trim();
    const normalizedEmail = (email || "").toLowerCase().trim();
    const incomingAdminCode = (adminCode || "").trim();
    const requestedNormalizedRole = normalizeRole(requestedRole);

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const expectedAdminCode = (process.env.ADMIN_SIGNUP_CODE || "").trim();

    let role = "user";

    const adminRequested = requestedNormalizedRole === "admin" || Boolean(incomingAdminCode);

    if (adminRequested) {
      if (!expectedAdminCode) {
        return res.status(503).json({
          message: "Admin signup is not configured. Contact system administrator.",
        });
      }

      if (incomingAdminCode !== expectedAdminCode) {
        return res.status(403).json({
          message: "Invalid admin signup code",
        });
      }

      role = "admin";
    }

    const user = await User.create({
      fullName: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizeRole(role),
    });

    const safeRole = normalizeRole(user.role);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: safeRole,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const safeRole = normalizeRole(user.role);

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: safeRole,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: safeRole,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
};
