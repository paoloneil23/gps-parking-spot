const mongoose = require("mongoose");

const carDetailSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    plateNumber: {
      type: String,
      default: "",
      trim: true,
    },
    carModel: {
      type: String,
      default: "",
      trim: true,
    },
    color: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: "car_details",
  }
);

module.exports = mongoose.model("CarDetail", carDetailSchema);
