const bcrypt = require("bcryptjs");
const User = require("../models/User");

const ensureAdminUser = async () => {
  const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const adminPassword = (process.env.ADMIN_PASSWORD || "").trim();
  const adminName = (process.env.ADMIN_NAME || "System Admin").trim();

  if (!adminEmail || !adminPassword) {
    console.log("Admin bootstrap skipped (set ADMIN_EMAIL and ADMIN_PASSWORD to enable it)");
    return;
  }

  const existingUser = await User.findOne({ email: adminEmail });

  if (existingUser) {
    if (existingUser.role !== "admin") {
      existingUser.role = "admin";
      await existingUser.save();
      console.log(`Promoted existing user to admin: ${adminEmail}`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await User.create({
    fullName: adminName || "System Admin",
    email: adminEmail,
    password: hashedPassword,
    role: "admin",
  });

  console.log(`Created admin user: ${adminEmail}`);
};

module.exports = ensureAdminUser;
