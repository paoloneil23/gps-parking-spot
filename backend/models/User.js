const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    phoneNumber: {
      type: String,
      default: "",
      trim: true,
    },
    carType: {
      type: String,
      default: "",
      trim: true,
    },
    carBrand: {
      type: String,
      default: "",
      trim: true,
    },
    carModel: {
      type: String,
      default: "",
      trim: true,
    },
    carPlateNumber: {
      type: String,
      default: "",
      trim: true,
    },
    carColor: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "Users",
  }
);

module.exports = mongoose.model("User", userSchema);
