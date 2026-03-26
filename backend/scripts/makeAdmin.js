const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

dotenv.config();

const makeAdmin = async () => {
  const emailArg = process.argv[2];
  const email = (emailArg || "").toLowerCase().trim();

  if (!email) {
    console.error("Usage: npm run make:admin -- user@email.com");
    process.exit(1);
  }

  try {
    await connectDB();

    const user = await User.findOneAndUpdate(
      { email },
      { role: "admin" },
      { new: true }
    ).lean();

    if (!user) {
      console.error(`User not found for email: ${email}`);
      process.exit(1);
    }

    console.log(`Updated ${user.email} to role: ${user.role}`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to update role:", error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

makeAdmin();
