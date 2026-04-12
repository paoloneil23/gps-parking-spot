const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/parkingController");

router.get("/search", searchParkingSpots);
router.get("/live", getParkingSpotsWithLiveAvailability);
router.post("/:spotId/reserve", reserveParkingSpot);
router.post("/reservations/:reservationId/pay", payReservation);
router.post("/reservations/:reservationId/cancel", cancelReservation);
router.post("/reservations/:reservationId/complete", completeReservation);
router.get("/reservations/history", getReservationHistoryForUser);
router.delete("/reservations/:reservationId", deleteReservationHistory);
router.patch("/:spotId/availability", setParkingSpotAvailability);
router.patch("/:spotId/reserved", setReservedParkingConfig);
router.get("/", getAllParkingSpots);
router.post("/", createParkingSpot);

module.exports = router;