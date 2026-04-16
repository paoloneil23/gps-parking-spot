const express = require("express");
const { registerUser, loginUser, getUserProfile, updateUserProfile, listUsersForAdmin } = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile/:userId", getUserProfile);
router.patch("/profile/:userId", updateUserProfile);
router.get("/users", listUsersForAdmin);

module.exports = router;
