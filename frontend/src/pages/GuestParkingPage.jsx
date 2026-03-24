import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import ParkingCard from "../components/ParkingCard";
import "./GuestParkingPage.css";

const API_BASE = "http://localhost:5000";

function GuestParkingPage() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const backTarget = location.state?.from || "/guest";

  const fetchSpots = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/parking/live`);

      if (!response.ok) {
        throw new Error("Failed to load parking spots from database");
      }

      const data = await response.json();
      setSpots(data);
      setLastUpdated(new Date());

      if (data.length > 0 && !selectedSpot) {
        setSelectedSpot(data[0]);
      }
    } catch (err) {
      setError(err.message || "Error loading parking spots");
      console.error("Fetch error:", err);
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [selectedSpot]);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  const availableCount = spots.filter((spot) => {
    if (typeof spot.availableSpots === "number") {
      return spot.availableSpots > 0;
    }
    return spot.available;
  }).length;

  return (
    <div className="guest-parking-page">
      <div className="guest-parking-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate(backTarget)}>
            ← Back
          </button>
          <h1>Parking Lot Map</h1>
        </div>
        <div className="header-stats">
          <span className="stat-badge available">
            {availableCount} Available
          </span>
          <span className="stat-badge total">Total: {spots.length}</span>
          <button
            type="button"
            className="manual-refresh-btn"
            onClick={() => fetchSpots({ silent: true })}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <span className={`realtime-dot ${isRefreshing ? "syncing" : "live"}`} />
          <span className="last-updated">
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString()}`
              : "Manual mode"}
          </span>
          <button
            type="button"
            className="guest-register-btn"
            onClick={() => navigate("/register")}
          >
            Create Account
          </button>
          <button
            type="button"
            className="guest-login-btn"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
        </div>
      </div>

      <div className="guest-parking-main">
        <div className="map-container">
          {loading ? (
            <div className="map-loading">
              <p>Loading parking map...</p>
            </div>
          ) : error ? (
            <div className="map-error">
              <p>{error}</p>
              <button onClick={fetchSpots}>Retry</button>
            </div>
          ) : (
            <MapView
              spot={selectedSpot}
              spots={spots}
              onSelectSpot={setSelectedSpot}
            />
          )}
        </div>

        <aside className={`guest-parking-sidebar ${showSidebar ? "open" : ""}`}>
          <button
            className="sidebar-toggle"
            onClick={() => setShowSidebar(!showSidebar)}
            title={showSidebar ? "Close sidebar" : "Open sidebar"}
          >
            {showSidebar ? "✕" : "☰"}
          </button>

          <div className="sidebar-content">
            <h2>Available Parking Lots</h2>
            <div className="sidebar-list">
              {spots.length === 0 ? (
                <p className="no-spots">No parking lots available</p>
              ) : (
                spots.map((spot) => (
                  <ParkingCard
                    key={spot._id}
                    spot={spot}
                    isSelected={selectedSpot?._id === spot._id}
                    onSelect={(s) => {
                      setSelectedSpot(s);
                      // Keep sidebar open for mobile interaction
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default GuestParkingPage;