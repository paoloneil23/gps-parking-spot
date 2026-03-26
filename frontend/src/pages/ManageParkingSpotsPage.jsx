import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ParkingSpotForm from "../components/ParkingSpotForm";
import "./ManageParkingSpotsPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ManageParkingSpotsPage() {
  const navigate = useNavigate();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadSpots = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/parking/live`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load parking spots.");
      }

      setSpots(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load parking spots.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpots();
  }, [loadSpots]);

  const handleSubmitSpot = async (payload) => {
    setIsSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/parking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          ok: false,
          message: data.message || "Failed to create parking spot.",
        };
      }

      setMessage(`Parking spot ${data.spotCode || payload.spotCode} added successfully.`);
      await loadSpots();
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        message: err.message || "Unable to create parking spot.",
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const total = spots.length;
    const available = spots.filter((spot) => {
      if (typeof spot.availableSpots === "number") {
        return spot.availableSpots > 0;
      }
      return spot.isAvailable !== false;
    }).length;
    const free = spots.filter(
      (spot) => spot.isPaid === false || (typeof spot.pricePerHour === "number" && spot.pricePerHour <= 0)
    ).length;

    return { total, available, free };
  }, [spots]);

  return (
    <>
      <Navbar userName="Admin" />

      <div className="manage-page">
        <div className="manage-container">
          <header className="manage-header">
            <div>
              <p className="manage-tag">Admin Panel</p>
              <h1>Manage Parking Spots</h1>
              <p>Add new spots and monitor current parking inventory.</p>
            </div>
            <button type="button" className="back-admin-btn" onClick={() => navigate("/admin")}>
              Back to Admin Dashboard
            </button>
          </header>

          <section className="manage-stats-grid">
            <article className="manage-stat-card">
              <h3>Total Spots</h3>
              <p>{stats.total}</p>
            </article>
            <article className="manage-stat-card">
              <h3>Available</h3>
              <p>{stats.available}</p>
            </article>
            <article className="manage-stat-card">
              <h3>Free Spots</h3>
              <p>{stats.free}</p>
            </article>
          </section>

          <div className="manage-grid">
            <section className="manage-card">
              <h2>Add New Parking Spot</h2>
              <ParkingSpotForm onSubmitSpot={handleSubmitSpot} isSubmitting={isSubmitting} />
              {message ? <p className="form-success">{message}</p> : null}
              {error ? <p className="form-error">{error}</p> : null}
            </section>

            <section className="manage-card">
              <div className="manage-list-header">
                <h2>Current Spots</h2>
                <button type="button" className="refresh-list-btn" onClick={loadSpots} disabled={loading}>
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>

              {loading ? (
                <p className="list-message">Loading parking spots...</p>
              ) : spots.length === 0 ? (
                <p className="list-message">No parking spots found.</p>
              ) : (
                <div className="spots-list-admin">
                  {spots.map((spot) => (
                    <article key={spot._id} className="spot-row-admin">
                      <div>
                        <strong>{spot.spotCode}</strong> - {spot.lotName}
                      </div>
                      <div className="spot-row-meta">
                        <span>{spot.type}</span>
                        <span>{spot.isPaid === false ? "Free" : `$${spot.pricePerHour}/hr`}</span>
                        <span>{spot.isAvailable === false ? "Unavailable" : "Available"}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}

export default ManageParkingSpotsPage;