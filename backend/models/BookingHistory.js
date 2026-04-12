const mongoose = require("mongoose");

const bookingHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
      unique: true,
      index: true,
    },
    parkingSpotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingSpot",
      required: true,
      index: true,
    },
    lotName: {
      type: String,
      default: "",
    },
    spotCode: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "regular",
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    amountDue: {
      type: Number,
      default: 0,
    },
    spotWasFullAtReservation: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "BookingHistory",
  }
);

module.exports = mongoose.model("BookingHistory", bookingHistorySchema);
