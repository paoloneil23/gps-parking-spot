import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MapView from "../components/MapView";
import ParkingCard from "../components/ParkingCard";
import { getApiBase, parseResponseSafely } from "../utils/api";
import "./GuestParkingPage.css";

const API_BASE = getApiBase();

function haversineDistanceMeters([lat1, lng1], [lat2, lng2]) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getSpotCoords(spot) {
  if (!spot) return null;
  if (spot.latitude && spot.longitude) {
    return [Number(spot.latitude), Number(spot.longitude)];
  }
  if (spot.location?.coordinates?.length >= 2) {
    return [Number(spot.location.coordinates[1]), Number(spot.location.coordinates[0])];
  }
  return null;
}

function getAvailabilityState(spot) {
  const totalSpaces = Number(spot.totalSpaces) > 0 ? Number(spot.totalSpaces) : 1;
  const availableSpots =
    typeof spot.availableSpots === "number"
      ? Math.max(spot.availableSpots, 0)
      : spot.isAvailable === false || spot.available === false
        ? 0
        : totalSpaces;

  if (availableSpots <= 0) {
    return "full";
  }

  if (availableSpots <= Math.max(1, Math.ceil(totalSpaces * 0.25))) {
    return "limited";
  }

  return "available";
}

function GuestParkingPage() {
  const [spots, setSpots] = useState([]);
  const [userCoords, setUserCoords] = useState(null);
  const [locationState, setLocationState] = useState("pending");
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const backTarget = location.state?.from || "/guest";

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationState("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords([position.coords.latitude, position.coords.longitude]);
        setLocationState("granted");
      },
      () => setLocationState("denied"),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }, []);

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

      const data = await parseResponseSafely(response);
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

  const sortedSpots = [...spots].sort((left, right) => {
    const leftCoords = getSpotCoords(left);
    const rightCoords = getSpotCoords(right);

    if (userCoords && leftCoords && rightCoords) {
      const leftDistance = haversineDistanceMeters(userCoords, leftCoords);
      const rightDistance = haversineDistanceMeters(userCoords, rightCoords);
      return leftDistance - rightDistance;
    }

    const leftState = getAvailabilityState(left);
    const rightState = getAvailabilityState(right);
    const order = { available: 0, limited: 1, full: 2 };
    return order[leftState] - order[rightState];
  });

  const availableCount = spots.filter((spot) => getAvailabilityState(spot) !== "full").length;
  const limitedCount = spots.filter((spot) => getAvailabilityState(spot) === "limited").length;
  const fullCount = spots.filter((spot) => getAvailabilityState(spot) === "full").length;

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
          <div className="header-status-legend" aria-label="Parking status legend">
            <span className="legend-chip available">Available</span>
            <span className="legend-chip limited">Limited</span>
            <span className="legend-chip full">Occupied</span>
          </div>
          <span className="stat-badge available">
            {availableCount} Available
          </span>
          <span className="stat-badge limited">{limitedCount} Limited</span>
          <span className="stat-badge full">{fullCount} Full</span>
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
          <span className={`location-badge location-${locationState}`}>
            {locationState === "granted"
              ? userCoords
                ? "Using your location"
                : "Location enabled"
              : locationState === "denied"
                ? "Location blocked"
                : locationState === "unsupported"
                  ? "No geolocation"
                  : "Detecting location"}
          </span>
          {userCoords && (
            <button
              type="button"
              className="location-recenter-btn"
              onClick={() => setRecenterSignal((value) => value + 1)}
            >
              My Location
            </button>
          )}
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
              spots={sortedSpots}
              onSelectSpot={setSelectedSpot}
              userCoords={userCoords}
              recenterSignal={recenterSignal}
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
                sortedSpots.map((spot) => (
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