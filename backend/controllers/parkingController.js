const ParkingSpot = require("../models/ParkingSpot");
const Reservation = require("../models/Reservation");
const BookingHistory = require("../models/BookingHistory");
const User = require("../models/User");

const getUserIdFromRequest = (req) => {
  const userId = req.body?.userId || req.query?.userId;
  return typeof userId === "string" ? userId.trim() : "";
};

const normalizeRole = (value) => {
  const role = (value || "user").toString().toLowerCase();
  return role === "admin" ? "admin" : "user";
};

const upsertBookingHistoryFromReservation = async (reservation, spot, extras = {}) => {
  if (!reservation) return;

  const parkingSpot = spot || {};

  await BookingHistory.findOneAndUpdate(
    { reservationId: reservation._id },
    {
      $set: {
        userId: reservation.userId,
        reservationId: reservation._id,
        parkingSpotId: reservation.parkingSpotId,
        lotName: parkingSpot.lotName || "Parking Lot",
        spotCode: parkingSpot.spotCode || "",
        type: parkingSpot.type || "regular",
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        paymentStatus: reservation.paymentStatus,
        amountDue: reservation.amountDue || 0,
        ...extras,
      },
    },
    { upsert: true, returnDocument: "after" }
  );
};

const updateParkingSpotAvailability = async (parkingSpotId) => {
  try {
    const spot = await ParkingSpot.findById(parkingSpotId);
    if (!spot) return;

    const totalSpaces = Number(spot.totalSpaces) > 0 ? Number(spot.totalSpaces) : 1;
    const now = new Date();

    const reservedCount = await Reservation.countDocuments({
      parkingSpotId,
      status: "active",
      startTime: { $lte: now },
      endTime: { $gte: now },
    });

    const isFull = reservedCount >= totalSpaces;
    spot.isAvailable = !isFull;
    spot.lastUpdated = new Date();
    await spot.save();

    return spot;
  } catch (error) {
    console.error("Error updating parking spot availability:", error);
  }
};

const getReservationHistoryForUser = async (req, res) => {
  try {
    const userId = getUserIdFromRequest(req);
    const userName =
      (req.query?.userName || req.query?.name || req.body?.userName || req.body?.name || "")
        .toString()
        .trim();

    if (!userId && !userName) {
      return res.status(400).json({ message: "userId or userName is required" });
    }

    const userIds = new Set();

    if (userId) {
      userIds.add(userId);
    }

    if (userName) {
      const matchedUsers = await User.find(
        {
          $or: [
            { fullName: { $regex: userName, $options: "i" } },
            { email: { $regex: userName, $options: "i" } },
          ],
        },
        { _id: 1 }
      ).lean();

      matchedUsers.forEach((user) => {
        if (user?._id) {
          userIds.add(String(user._id));
        }
      });
    }

    if (userIds.size === 0) {
      return res.status(200).json({ reservations: [] });
    }

    const reservations = await Reservation.find({
      userId: { $in: Array.from(userIds) },
    })
      .populate("parkingSpotId")
      .sort({ createdAt: -1 })
      .lean();

    const history = reservations.map((reservation) => {
      const parkingSpot = reservation.parkingSpotId || {};
      return {
        id: reservation._id,
        reservationId: reservation._id,
        status: reservation.status,
        paymentStatus: reservation.paymentStatus,
        amountDue: reservation.amountDue,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        createdAt: reservation.createdAt,
        parkingSpot: {
          id: parkingSpot._id,
          spotCode: parkingSpot.spotCode,
          lotName: parkingSpot.lotName,
          type: parkingSpot.type,
          pricePerHour: parkingSpot.pricePerHour,
          isAvailable: parkingSpot.isAvailable,
          isPaid: parkingSpot.isPaid,
          isReserved: parkingSpot.isReserved || false,
          reservedLabel: parkingSpot.reservedLabel || "",
          reservedForRoles: parkingSpot.reservedForRoles || [],
        },
      };
    });

    return res.status(200).json({ reservations: history });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAllParkingSpots = async (req, res) => {
  try {
    const spots = await ParkingSpot.find();
    res.status(200).json(spots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createParkingSpot = async (req, res) => {
  try {
    const spot = await ParkingSpot.create(req.body);
    res.status(201).json(spot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchParkingSpots = async (req, res) => {
  try {
    const { location, maxPrice, freeOnly, lng, lat } = req.query;

    let query = {};

    if (location) {
      query.$or = [
        { lotName: { $regex: location, $options: "i" } },
        { spotCode: { $regex: location, $options: "i" } },
      ];
    }

    if (maxPrice) {
      query.pricePerHour = { $lte: Number(maxPrice) };
    }

    const freeOnlyEnabled = ["1", "true", "yes", "on"].includes(
      String(freeOnly || "").toLowerCase()
    );

    if (freeOnlyEnabled) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [{ isPaid: false }, { pricePerHour: { $lte: 0 } }],
      });
    }

    let spots = await ParkingSpot.find(query).lean();

    if (lat && lng) {
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);

      const toRadians = (value) => (value * Math.PI) / 180;

      const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
        const R = 6371;
        const dLat = toRadians(lat2 - lat1);
        const dLng = toRadians(lng2 - lng1);

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRadians(lat1)) *
            Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      spots = spots.map((spot) => {
        const coordinates = spot.location?.coordinates || [];
        const spotLng = Number(coordinates[0]);
        const spotLat = Number(coordinates[1]);

        if (Number.isFinite(spotLat) && Number.isFinite(spotLng)) {
          const distanceKm = calculateDistanceKm(userLat, userLng, spotLat, spotLng);

          return {
            ...spot,
            distanceKm: Number(distanceKm.toFixed(2)),
            distanceToEntranceKm: Number(distanceKm.toFixed(2)),
            distanceToEVChargerKm:
              String(spot.type || "").toLowerCase() === "ev"
                ? Number((distanceKm + 0.1).toFixed(2))
                : null,
          };
        }

        return {
          ...spot,
          distanceKm: null,
          distanceToEntranceKm: null,
          distanceToEVChargerKm: null,
        };
      });

      spots.sort((a, b) => {
        const aAvailable =
          typeof a.availableSpots === "number"
            ? a.availableSpots > 0
            : typeof a.isAvailable === "boolean"
              ? a.isAvailable
              : true;

        const bAvailable =
          typeof b.availableSpots === "number"
            ? b.availableSpots > 0
            : typeof b.isAvailable === "boolean"
              ? b.isAvailable
              : true;

        if (aAvailable !== bAvailable) {
          return aAvailable ? -1 : 1;
        }

        if (a.distanceKm == null && b.distanceKm == null) return 0;
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;

        return a.distanceKm - b.distanceKm;
      });

      spots = spots.map((spot, index) => {
        const isAvailable =
          typeof spot.availableSpots === "number"
            ? spot.availableSpots > 0
            : typeof spot.isAvailable === "boolean"
              ? spot.isAvailable
              : true;

        return {
          ...spot,
          isBestOption: index === 0 && isAvailable,
        };
      });
    }

    res.status(200).json(spots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getParkingSpotsWithLiveAvailability = async (req, res) => {
  try {
    const now = new Date();

    const [spots, activeReservations] = await Promise.all([
      ParkingSpot.find().lean(),
      Reservation.aggregate([
        {
          $match: {
            status: "active",
            startTime: { $lte: now },
            endTime: { $gte: now },
          },
        },
        {
          $group: {
            _id: "$parkingSpotId",
            reservedSpots: { $sum: 1 },
          },
        },
      ]),
    ]);

    const reservationMap = new Map(
      activeReservations.map((item) => [String(item._id), item.reservedSpots])
    );

    const enrichedSpots = spots.map((spot) => {
      const totalSpaces = Number(spot.totalSpaces) > 0 ? Number(spot.totalSpaces) : 1;
      const reservedSpots = Math.min(
        reservationMap.get(String(spot._id)) || 0,
        totalSpaces
      );
      const availableSpots = Math.max(totalSpaces - reservedSpots, 0);
      const baseAvailableFlag =
        typeof spot.available === "boolean"
          ? spot.available
          : typeof spot.isAvailable === "boolean"
            ? spot.isAvailable
            : true;

      const parkingLotName = spot.locationName || spot.lotName || "Parking Lot";
      const address = spot.address || "";

      let latitude = spot.latitude;
      let longitude = spot.longitude;

      if (
        (!Number.isFinite(latitude) || !Number.isFinite(longitude)) &&
        spot.location &&
        Array.isArray(spot.location.coordinates) &&
        spot.location.coordinates.length >= 2
      ) {
        longitude = Number(spot.location.coordinates[0]);
        latitude = Number(spot.location.coordinates[1]);
      }

      return {
        ...spot,
        locationName: parkingLotName,
        address,
        latitude,
        longitude,
        totalSpaces,
        reservedSpots,
        availableSpots,
        available: baseAvailableFlag && availableSpots > 0,
        isReserved: spot.isReserved || false,
        reservedLabel: spot.reservedLabel || "",
        reservedForRoles: spot.reservedForRoles || [],
      };
    });

    res.status(200).json(enrichedSpots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reserveParkingSpot = async (req, res) => {
  try {
    const { spotId } = req.params;
    const userId = getUserIdFromRequest(req);
    const durationHours = Math.max(Number(req.body?.durationHours) || 1, 1);

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRole = normalizeRole(user.role);

    const spot = await ParkingSpot.findById(spotId).lean();

    if (!spot) {
      return res.status(404).json({ message: "Parking spot not found" });
    }

    const totalSpaces = Number(spot.totalSpaces) > 0 ? Number(spot.totalSpaces) : 1;
    const now = new Date();

    const [reservedCount, existingUserReservation] = await Promise.all([
      Reservation.countDocuments({
        parkingSpotId: spot._id,
        status: "active",
        startTime: { $lte: now },
        endTime: { $gte: now },
      }),
      Reservation.findOne({
        parkingSpotId: spot._id,
        userId,
        status: "active",
        endTime: { $gte: now },
      }).lean(),
    ]);

    if (existingUserReservation) {
      return res.status(409).json({
        message: "You already have an active reservation for this spot",
        reservation: existingUserReservation,
      });
    }

    if (spot.isReserved) {
      const allowedRoles = Array.isArray(spot.reservedForRoles) ? spot.reservedForRoles : [];

      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        return res.status(403).json({
          message: "This parking spot is reserved for authorized users only",
        });
      }
    }

    if (reservedCount >= totalSpaces || spot.isAvailable === false) {
      return res.status(409).json({ message: "This parking spot is currently full" });
    }

    const endTime = new Date(now.getTime() + durationHours * 60 * 60 * 1000);
    const amountDue =
      spot.isPaid === false ? 0 : (Number(spot.pricePerHour) || 0) * durationHours;

    const reservation = await Reservation.create({
      userId,
      parkingSpotId: spot._id,
      startTime: now,
      endTime,
      status: "active",
      paymentStatus: amountDue > 0 ? "pending" : "paid",
      amountDue,
      paidAt: amountDue > 0 ? null : now,
    });

    await updateParkingSpotAvailability(spot._id);

    const spotWasFullAtReservation = reservedCount + 1 >= totalSpaces;
    await upsertBookingHistoryFromReservation(reservation, spot, {
      spotWasFullAtReservation,
    });

    return res.status(201).json({
      message:
        amountDue > 0
          ? "Spot reserved. Please complete payment."
          : "Spot reserved successfully.",
      reservation,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const payReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = getUserIdFromRequest(req);
    const paymentMethod = (req.body?.paymentMethod || "card").toString();

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (String(reservation.userId) !== userId) {
      return res.status(403).json({ message: "You can only pay your own reservation" });
    }

    if (reservation.status !== "active") {
      return res.status(400).json({ message: "Only active reservations can be paid" });
    }

    if (reservation.paymentStatus === "paid") {
      return res.status(200).json({
        message: "Reservation is already paid",
        reservation,
      });
    }

    reservation.paymentStatus = "paid";
    reservation.paidAt = new Date();
    reservation.paymentMethod = paymentMethod;
    await reservation.save();

    const spot = await ParkingSpot.findById(reservation.parkingSpotId).lean();
    await upsertBookingHistoryFromReservation(reservation, spot);

    return res.status(200).json({
      message: "Payment successful",
      reservation,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const cancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (String(reservation.userId) !== userId) {
      return res.status(403).json({ message: "You can only cancel your own reservation" });
    }

    if (reservation.status !== "active") {
      return res.status(400).json({ message: "Only active reservations can be cancelled" });
    }

    reservation.status = "cancelled";
    await reservation.save();

    await updateParkingSpotAvailability(reservation.parkingSpotId);

    const spot = await ParkingSpot.findById(reservation.parkingSpotId).lean();
    await upsertBookingHistoryFromReservation(reservation, spot);

    return res.status(200).json({
      message: "Reservation cancelled successfully",
      reservation,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const completeReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (String(reservation.userId) !== userId) {
      return res.status(403).json({ message: "You can only complete your own reservation" });
    }

    if (reservation.status !== "active") {
      return res.status(400).json({ message: "Only active reservations can be completed" });
    }

    reservation.status = "completed";
    await reservation.save();

    await updateParkingSpotAvailability(reservation.parkingSpotId);

    const spot = await ParkingSpot.findById(reservation.parkingSpotId).lean();
    await upsertBookingHistoryFromReservation(reservation, spot);

    return res.status(200).json({
      message: "Reservation completed successfully",
      reservation,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteReservationHistory = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const userId = getUserIdFromRequest(req);

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    if (String(reservation.userId) !== userId) {
      return res.status(403).json({ message: "You can only delete your own reservation history" });
    }

    const parkingSpotId = reservation.parkingSpotId;
    const wasActive = reservation.status === "active";

    await Reservation.findByIdAndDelete(reservationId);
    await BookingHistory.findOneAndDelete({ reservationId });

    if (wasActive) {
      await updateParkingSpotAvailability(parkingSpotId);
    }

    return res.status(200).json({
      message: "Reservation history deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const setParkingSpotAvailability = async (req, res) => {
  try {
    const { spotId } = req.params;
    const userId = getUserIdFromRequest(req);
    const { isAvailable } = req.body || {};

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({ message: "isAvailable must be a boolean" });
    }

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const spot = await ParkingSpot.findById(spotId);

    if (!spot) {
      return res.status(404).json({ message: "Parking spot not found" });
    }

    spot.isAvailable = isAvailable;
    spot.lastUpdated = new Date();
    await spot.save();

    return res.status(200).json({
      message: `Parking spot marked as ${isAvailable ? "available" : "full"}`,
      spot,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const setReservedParkingConfig = async (req, res) => {
  try {
    const { spotId } = req.params;
    const { isReserved, reservedLabel, reservedForRoles } = req.body || {};

    const spot = await ParkingSpot.findById(spotId);

    if (!spot) {
      return res.status(404).json({ message: "Parking spot not found" });
    }

    if (typeof isReserved === "boolean") {
      spot.isReserved = isReserved;
    }

    if (typeof reservedLabel === "string") {
      spot.reservedLabel = reservedLabel.trim();
    }

    if (Array.isArray(reservedForRoles)) {
      spot.reservedForRoles = reservedForRoles.map((role) => normalizeRole(role));
    }

    spot.lastUpdated = new Date();
    await spot.save();

    return res.status(200).json({
      message: "Reserved parking configuration updated successfully",
      spot,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllParkingSpots,
  createParkingSpot,
  searchParkingSpots,
  getParkingSpotsWithLiveAvailability,
  reserveParkingSpot,
  payReservation,
  cancelReservation,
  completeReservation,
  getReservationHistoryForUser,
  deleteReservationHistory,
  setParkingSpotAvailability,
  setReservedParkingConfig,
};