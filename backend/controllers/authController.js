const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const CarDetail = require("../models/CarDetail");

const normalizeRole = (value) => {
  const role = (value || "user").toString().toLowerCase();
  return role === "admin" ? "admin" : "user";
};

const toSafeUser = (user) => ({
  id: user._id,
  userId: user._id,
  fullName: user.fullName,
  email: user.email,
  phoneNumber: user.phoneNumber || "",
  carType: user.carType || "",
  carBrand: user.carBrand || "",
  carModel: user.carModel || "",
  carPlateNumber: user.carPlateNumber || "",
  carColor: user.carColor || "",
  role: normalizeRole(user.role),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const normalizeCarDetails = (carDetails) => ({
  plateNumber: carDetails?.plateNumber || "",
  carModel: carDetails?.carModel || "",
  color: carDetails?.color || "",
});

const getCarDetailsByUserId = async (userId) => {
  if (!userId) {
    return normalizeCarDetails(null);
  }

  const carDetails = await CarDetail.findOne({ userId: String(userId) }).lean();
  return normalizeCarDetails(carDetails);
};

const buildUserResponse = async (user) => {
  const safeUser = toSafeUser(user);
  const carDetails = await getCarDetailsByUserId(safeUser.id);

  return {
    ...safeUser,
    plateNumber: carDetails.plateNumber,
    carModel: carDetails.carModel || safeUser.carModel || "",
    color: carDetails.color,
    carDetails,
  };
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
      phoneNumber: (req.body?.phoneNumber || "").toString().trim(),
      carType: (req.body?.carType || "").toString().trim(),
      carBrand: (req.body?.carBrand || "").toString().trim(),
      carModel: (req.body?.carModel || "").toString().trim(),
      carPlateNumber: (req.body?.carPlateNumber || "").toString().trim(),
      carColor: (req.body?.carColor || "").toString().trim(),
      role: normalizeRole(role),
    });

    await CarDetail.findOneAndUpdate(
      { userId: String(user._id) },
      {
        $set: {
          userId: String(user._id),
          plateNumber: (req.body?.plateNumber || req.body?.carPlateNumber || "").toString().trim(),
          carModel: (req.body?.carModel || "").toString().trim(),
          color: (req.body?.color || req.body?.carColor || "").toString().trim(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: await buildUserResponse(user),
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

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: normalizeRole(user.role),
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: await buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: await buildUserResponse(user) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = (req.body?.userId || req.query?.userId || "").toString().trim();

    if (!userId || !requesterId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (userId !== requesterId) {
      return res.status(403).json({ message: "You can only update your own profile" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newEmail = (req.body?.email || user.email || "").toString().trim().toLowerCase();
    if (newEmail && newEmail !== user.email) {
      const emailExists = await User.findOne({ email: newEmail, _id: { $ne: userId } });
      if (emailExists) {
        return res.status(409).json({ message: "Email already registered" });
      }
      user.email = newEmail;
    }

    if (typeof req.body?.fullName === "string" && req.body.fullName.trim()) {
      user.fullName = req.body.fullName.trim();
    }

    if (typeof req.body?.phoneNumber === "string") {
      user.phoneNumber = req.body.phoneNumber.trim();
    }

    if (typeof req.body?.carType === "string") {
      user.carType = req.body.carType.trim();
    }

    if (typeof req.body?.carBrand === "string") {
      user.carBrand = req.body.carBrand.trim();
    }

    if (typeof req.body?.carModel === "string") {
      user.carModel = req.body.carModel.trim();
    }

    if (typeof req.body?.carPlateNumber === "string") {
      user.carPlateNumber = req.body.carPlateNumber.trim();
    }

    if (typeof req.body?.carColor === "string") {
      user.carColor = req.body.carColor.trim();
    }

    const hasCarDetailsPayload =
      req.body?.plateNumber !== undefined ||
      req.body?.carPlateNumber !== undefined ||
      req.body?.carModel !== undefined ||
      req.body?.color !== undefined ||
      req.body?.carColor !== undefined;

    if (hasCarDetailsPayload) {
      const plateNumber = (req.body?.plateNumber || req.body?.carPlateNumber || "")
        .toString()
        .trim();
      const carModel = (req.body?.carModel || "").toString().trim();
      const color = (req.body?.color || req.body?.carColor || "").toString().trim();

      await CarDetail.findOneAndUpdate(
        { userId: String(userId) },
        {
          $set: {
            userId: String(userId),
            plateNumber,
            carModel,
            color,
          },
        },
        { upsert: true, returnDocument: 'after' }
      );
    }

    if (typeof req.body?.password === "string" && req.body.password.trim()) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password.trim(), salt);
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      user: await buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const listUsersForAdmin = async (req, res) => {
  try {
    const requesterId = (req.query?.userId || req.body?.userId || "").toString().trim();

    if (!requesterId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const requester = await User.findById(requesterId).lean();

    if (!requester) {
      return res.status(404).json({ message: "Requesting user not found" });
    }

    if (normalizeRole(requester.role) !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).lean();

    const safeUsers = await Promise.all(users.map((user) => buildUserResponse(user)));

    return res.status(200).json({ users: safeUsers });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  listUsersForAdmin,
};
