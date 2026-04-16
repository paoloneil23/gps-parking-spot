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
} = require("../controllers/parkingController");

router.get("/search", searchParkingSpots);   // ✅ THIS IS IMPORTANT
router.get("/live", getParkingSpotsWithLiveAvailability);
router.post("/:spotId/reserve", reserveParkingSpot);
router.post("/reservations/:reservationId/pay", payReservation);
router.post("/reservations/:reservationId/cancel", cancelReservation);
router.post("/reservations/:reservationId/complete", completeReservation);
router.get("/reservations/history", getReservationHistoryForUser);
router.delete("/reservations/:reservationId", deleteReservationHistory);
router.patch("/:spotId/availability", setParkingSpotAvailability);
router.get("/", getAllParkingSpots);
router.post("/", createParkingSpot);

module.exports = router;