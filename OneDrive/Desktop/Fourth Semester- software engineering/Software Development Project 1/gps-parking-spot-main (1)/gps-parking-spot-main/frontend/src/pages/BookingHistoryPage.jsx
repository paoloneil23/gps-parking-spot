import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getApiBase, parseResponseSafely } from "../utils/api";
import "./BookingHistoryPage.css";

const API_BASE = getApiBase();

function BookingHistoryPage() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");

  const currentUser = useMemo(() => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  }, []);

  const userId = currentUser?.id || currentUser?._id || currentUser?.userId || "";
  const userName = currentUser?.fullName || currentUser?.email || "";

  const loadHistory = useCallback(async () => {
    if (!userId && !userName) {
      setError("Please login to view your booking history.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams();
      if (userId) {
        query.set("userId", userId);
      }
      if (userName) {
        query.set("userName", userName);
      }

      const response = await fetch(`${API_BASE}/api/parking/reservations/history?${query.toString()}`);
      const data = await parseResponseSafely(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to load booking history.");
      }

      setReservations(Array.isArray(data.reservations) ? data.reservations : []);
    } catch (err) {
      setError(err.message || "Unable to load booking history.");
    } finally {
      setLoading(false);
    }
  }, [userId, userName]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDeleteReservation = async (reservationId) => {
    if (!userId || deletingId) {
      return;
    }

    setDeletingId(reservationId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/parking/reservations/${reservationId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await parseResponseSafely(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete booking history item.");
      }

      setMessage(data.message || "Booking history item deleted.");
      await loadHistory();
    } catch (err) {
      setError(err.message || "Unable to delete booking history item.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <>
      <Navbar userName={currentUser?.fullName || "User"} />
      <div className="booking-history-page">
        <div className="booking-history-container">
          <header className="booking-history-header">
            <div>
              <p className="booking-history-tag">Home</p>
              <h1>Booking History</h1>
              <p>Review all past and active parking reservations.</p>
            </div>
            <button type="button" className="back-home-btn" onClick={() => navigate("/dashboard")}>
              Back to Main Page
            </button>
          </header>

          {message ? <p className="booking-history-message success">{message}</p> : null}
          {error ? <p className="booking-history-message error">{error}</p> : null}

          <section className="booking-history-card">
            {loading ? (
              <p className="booking-history-empty">Loading booking history...</p>
            ) : reservations.length === 0 ? (
              <p className="booking-history-empty">
                No booking history found. Reserve a parking spot from the Home Page, then refresh this page.
              </p>
            ) : (
              <div className="booking-history-list">
                {reservations.map((reservation) => (
                  <article key={reservation.id} className="booking-history-item">
                    <div className="booking-history-item-main">
                      <div>
                        <h3>{reservation.parkingSpot?.lotName || "Parking Spot"}</h3>
                        <p>
                          {reservation.parkingSpot?.spotCode || "N/A"} • {reservation.parkingSpot?.type || "regular"}
                        </p>
                      </div>
                      <span className={`history-status status-${reservation.status}`}>
                        {reservation.status}
                      </span>
                    </div>

                    <div className="booking-history-meta">
                      <span>Start: {reservation.startTime ? new Date(reservation.startTime).toLocaleString() : "-"}</span>
                      <span>End: {reservation.endTime ? new Date(reservation.endTime).toLocaleString() : "-"}</span>
                      <span>Payment: {reservation.paymentStatus || "pending"}</span>
                      <span>Amount: ${reservation.amountDue ?? 0}</span>
                    </div>

                    <div className="booking-history-actions">
                      <button
                        type="button"
                        className="delete-history-btn"
                        onClick={() => handleDeleteReservation(reservation.id)}
                        disabled={deletingId === reservation.id}
                      >
                        {deletingId === reservation.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default BookingHistoryPage;
