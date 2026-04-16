import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ParkingSpotForm from "../components/ParkingSpotForm";
import { getApiBase, parseResponseSafely } from "../utils/api";
import "./ManageParkingSpotsPage.css";

const API_BASE = getApiBase();

function ManageParkingSpotsPage() {
  const navigate = useNavigate();
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingSpotId, setUpdatingSpotId] = useState("");
  const [occupiedInputs, setOccupiedInputs] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const getCurrentUserId = () => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!storedUser) {
      return "";
    }

    try {
      const parsed = JSON.parse(storedUser);
      return parsed.id || parsed._id || "";
    } catch {
      return "";
    }
  };

  const loadSpots = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/parking/live`);
      const data = await parseResponseSafely(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to load parking spots.");
      }

      setSpots(Array.isArray(data) ? data : []);
      setOccupiedInputs(
        (Array.isArray(data) ? data : []).reduce((acc, spot) => {
          acc[spot._id] = String(Math.max(0, Number(spot.occupiedSpots) || 0));
          return acc;
        }, {})
      );
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

      const data = await parseResponseSafely(response);

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

  const handleToggleAvailability = async (spot) => {
    const userId = getCurrentUserId();

    if (!userId) {
      setError("Please login as admin to update spot availability.");
      setMessage("");
      return;
    }

    const currentAvailable =
      typeof spot.availableSpots === "number"
        ? spot.availableSpots > 0
        : spot.isAvailable !== false;

    const nextAvailability = !currentAvailable;

    setUpdatingSpotId(spot._id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/parking/${spot._id}/availability`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          isAvailable: nextAvailability,
        }),
      });

      const data = await parseResponseSafely(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to update availability.");
      }

      setMessage(data.message || "Spot availability updated successfully.");
      await loadSpots();
    } catch (err) {
      setError(err.message || "Unable to update spot availability.");
    } finally {
      setUpdatingSpotId("");
    }
  };

  const handleSaveOccupiedSpots = async (spot) => {
    const userId = getCurrentUserId();

    if (!userId) {
      setError("Please login as admin to update occupied spots.");
      setMessage("");
      return;
    }

    const rawValue = occupiedInputs[spot._id] || "0";
    const totalSpaces = Math.max(1, Number(spot.totalSpaces) || 1);
    const occupiedSpots = Math.min(Math.max(0, Number(rawValue) || 0), totalSpaces);

    setUpdatingSpotId(spot._id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/parking/${spot._id}/availability`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          occupiedSpots,
        }),
      });

      const data = await parseResponseSafely(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to update occupied spots.");
      }

      setMessage(data.message || "Occupied spots updated successfully.");
      await loadSpots();
    } catch (err) {
      setError(err.message || "Unable to update occupied spots.");
    } finally {
      setUpdatingSpotId("");
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
                        <span>
                          {typeof spot.availableSpots === "number"
                            ? spot.availableSpots > 0
                              ? "Available"
                              : "Full"
                            : spot.isAvailable === false
                              ? "Full"
                              : "Available"}
                        </span>
                        <span>
                          {Math.max(0, Number(spot.availableSpots) || 0)} / {Math.max(1, Number(spot.totalSpaces) || 1)} free
                        </span>
                        <label>
                          Occupied
                          <input
                            type="number"
                            min="0"
                            max={Math.max(1, Number(spot.totalSpaces) || 1)}
                            value={occupiedInputs[spot._id] ?? "0"}
                            onChange={(event) =>
                              setOccupiedInputs((prev) => ({
                                ...prev,
                                [spot._id]: event.target.value,
                              }))
                            }
                            style={{ width: 70, marginLeft: 6 }}
                          />
                        </label>
                        <button
                          type="button"
                          className="refresh-list-btn"
                          onClick={() => handleSaveOccupiedSpots(spot)}
                          disabled={updatingSpotId === spot._id}
                        >
                          {updatingSpotId === spot._id ? "Saving..." : "Save Occupied"}
                        </button>
                        <button
                          type="button"
                          className="refresh-list-btn"
                          onClick={() => handleToggleAvailability(spot)}
                          disabled={updatingSpotId === spot._id}
                        >
                          {updatingSpotId === spot._id
                            ? "Updating..."
                            : typeof spot.availableSpots === "number"
                              ? spot.availableSpots > 0
                                ? "Mark Full"
                                : "Mark Available"
                              : spot.isAvailable === false
                                ? "Mark Available"
                                : "Mark Full"}
                        </button>
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