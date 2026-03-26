import { useCallback, useEffect, useMemo, useState } from "react";
import ParkingCard from "../components/ParkingCard";
import MapView from "../components/MapView";
import Navbar from "../components/Navbar";
import ParkingTypeFilter from "../components/ParkingTypeFilter";
import "./DashboardPage.css";

const API_BASE = "http://localhost:5000";

function DashboardPage() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchText, setSearchText] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [onlyFree, setOnlyFree] = useState(false);
  const [selectedParkingTypes, setSelectedParkingTypes] = useState([]);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [reservationMessage, setReservationMessage] = useState("");
  const [reservationError, setReservationError] = useState("");
  const [isReserving, setIsReserving] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [activeReservation, setActiveReservation] = useState(null);

  const userDisplayName = useMemo(() => {
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");

    if (!storedUser) {
      return "User";
    }

    try {
      const parsed = JSON.parse(storedUser);
      return parsed.fullName || parsed.email || "User";
    } catch {
      return "User";
    }
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

      const data = await response.json();
      setSpots(data);
      setLastUpdated(new Date());

      if (data.length > 0) {
        setSelectedSpot((prev) => {
          if (!prev) return data[0];
          const existing = data.find((spot) => spot._id === prev._id);
          return existing || data[0];
        });
      } else {
        setSelectedSpot(null);
      }
    } catch (err) {
      setError(err.message || "Something went wrong while loading parking data");
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSpots();
  }, [fetchSpots]);

  const filteredSpots = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    const priceLimit = maxPrice === "" ? null : Number(maxPrice);

    return spots.filter((spot) => {
      const matchesText =
        term.length === 0 ||
        (spot.spotCode || "").toLowerCase().includes(term) ||
        (spot.lotName || "").toLowerCase().includes(term);

      const isAvailable = spot.isAvailable !== undefined ? spot.isAvailable : spot.available;
      const matchesAvailability = onlyAvailable ? Boolean(isAvailable) : true;
      const matchesAvailableSpots =
        onlyAvailable && typeof spot.availableSpots === "number"
          ? spot.availableSpots > 0
          : true;

      const matchesPrice =
        priceLimit === null
          ? true
          : typeof spot.pricePerHour === "number" && spot.pricePerHour <= priceLimit;

      const matchesFree =
        !onlyFree ||
        spot.isPaid === false ||
        (typeof spot.pricePerHour === "number" && spot.pricePerHour <= 0);

      const matchesType =
        selectedParkingTypes.length === 0
          ? true
          : selectedParkingTypes.includes(spot.type || "regular");

      return (
        matchesText &&
        matchesAvailability &&
        matchesAvailableSpots &&
        matchesPrice &&
        matchesFree &&
        matchesType
      );
    });
  }, [spots, searchText, maxPrice, onlyAvailable, onlyFree, selectedParkingTypes]);

  useEffect(() => {
    if (filteredSpots.length === 0) {
      setSelectedSpot(null);
      return;
    }

    setSelectedSpot((prev) => {
      if (!prev) return filteredSpots[0];
      const keep = filteredSpots.find((spot) => spot._id === prev._id);
      return keep || filteredSpots[0];
    });
  }, [filteredSpots]);

  const totalCount = spots.length;
  const availableCount = spots.filter((spot) => {
    if (typeof spot.availableSpots === "number") {
      return spot.availableSpots > 0;
    }

    const isAvailable = spot.isAvailable !== undefined ? spot.isAvailable : spot.available;
    return isAvailable;
  }).length;

  const selectedAvailableSpots =
    typeof selectedSpot?.availableSpots === "number"
      ? Math.max(selectedSpot.availableSpots, 0)
      : selectedSpot?.isAvailable !== false
        ? 1
        : 0;
  const selectedSpotIsPaid = selectedSpot?.isPaid !== false;
  const canReserveSelectedSpot = Boolean(selectedSpot) && selectedAvailableSpots > 0;

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

  const handleReserveSpot = async () => {
    if (!selectedSpot?._id || isReserving) {
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
      setReservationError("Please login to reserve a parking spot.");
      setReservationMessage("");
      return;
    }

    setIsReserving(true);
    setReservationError("");
    setReservationMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/parking/${selectedSpot._id}/reserve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          durationHours: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reserve this parking spot");
      }

      setActiveReservation(data.reservation || null);
      setReservationMessage(data.message || "Spot reserved successfully.");
      await fetchSpots({ silent: true });
    } catch (err) {
      setReservationError(err.message || "Unable to reserve this parking spot");
    } finally {
      setIsReserving(false);
    }
  };

  const handlePayReservation = async () => {
    if (!activeReservation?._id || isPaying) {
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
      setReservationError("Please login to pay for your reservation.");
      setReservationMessage("");
      return;
    }

    setIsPaying(true);
    setReservationError("");
    setReservationMessage("");

    try {
      const response = await fetch(
        `${API_BASE}/api/parking/reservations/${activeReservation._id}/pay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            paymentMethod: "card",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Payment failed");
      }

      setActiveReservation(data.reservation || null);
      setReservationMessage(data.message || "Payment successful.");
      await fetchSpots({ silent: true });
    } catch (err) {
      setReservationError(err.message || "Unable to process payment");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <>
      <Navbar userName={userDisplayName} />
      <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>User Dashboard</h1>
          <p className="dashboard-user-name">Welcome, {userDisplayName}</p>
          <p>Live parking information loaded from your MongoDB database.</p>
          <p className="dashboard-realtime-status">
            <span className={`realtime-dot ${isRefreshing ? "syncing" : "live"}`} />
            {isRefreshing ? "Syncing latest data..." : "Manual updates only"}
            {lastUpdated
              ? ` • Last updated ${lastUpdated.toLocaleTimeString()}`
              : ""}
          </p>
        </div>
        <button
          type="button"
          className="refresh-btn"
          onClick={() => fetchSpots({ silent: true })}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span>Total Spots</span>
          <strong>{totalCount}</strong>
        </div>
        <div className="stat-card">
          <span>Available Now</span>
          <strong>{availableCount}</strong>
        </div>
        <div className="stat-card">
          <span>Showing</span>
          <strong>{filteredSpots.length}</strong>
        </div>
      </div>

      <div className="dashboard-filters">
        <input
          type="text"
          placeholder="Search by location or address"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max price"
          min="0"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
        <label className="availability-toggle">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
          />
          Only available spots
        </label>

        <label className="availability-toggle">
          <input
            type="checkbox"
            checked={onlyFree}
            onChange={(e) => setOnlyFree(e.target.checked)}
          />
          Free parking only
        </label>

        <ParkingTypeFilter
          selectedTypes={selectedParkingTypes}
          onChange={setSelectedParkingTypes}
        />
      </div>

      {loading ? <p className="dashboard-message">Loading parking spots...</p> : null}
      {error ? <p className="dashboard-error">{error}</p> : null}

      {!loading && !error ? (
        <div className="dashboard-content-grid">
          <section className="dashboard-list">
            {filteredSpots.length === 0 ? (
              <p className="dashboard-message">No parking spots match your filters.</p>
            ) : (
              filteredSpots.map((spot) => (
                <ParkingCard
                  key={spot._id}
                  spot={spot}
                  isSelected={selectedSpot?._id === spot._id}
                  onSelect={setSelectedSpot}
                />
              ))
            )}
          </section>

          <aside>
            <div className="reservation-actions-panel">
              <h3>Reserve & Pay</h3>
              <p>
                {selectedSpot
                  ? `Selected: ${selectedSpot.lotName || selectedSpot.spotCode || "Parking Spot"}`
                  : "Select a spot to reserve."}
              </p>
              <div className="reservation-actions-row">
                <button
                  type="button"
                  className="reserve-btn"
                  onClick={handleReserveSpot}
                  disabled={!canReserveSelectedSpot || isReserving}
                >
                  {isReserving ? "Reserving..." : "Reserve Spot"}
                </button>

                <button
                  type="button"
                  className="pay-btn"
                  onClick={handlePayReservation}
                  disabled={
                    !activeReservation ||
                    activeReservation.paymentStatus === "paid" ||
                    !selectedSpotIsPaid ||
                    isPaying
                  }
                >
                  {isPaying ? "Paying..." : "Pay Reservation"}
                </button>
              </div>

              {activeReservation ? (
                <p className="reservation-details">
                  Reservation ID: {activeReservation._id} • Payment: {activeReservation.paymentStatus}
                  {typeof activeReservation.amountDue === "number"
                    ? ` • Amount: $${activeReservation.amountDue.toFixed(2)}`
                    : ""}
                </p>
              ) : null}

              {reservationMessage ? (
                <p className="reservation-message">{reservationMessage}</p>
              ) : null}
              {reservationError ? <p className="reservation-error">{reservationError}</p> : null}
            </div>

            <div className="dashboard-map-panel">
              <div className="dashboard-map-title-row">
                <h3>Parking Map</h3>
              </div>
              <p className="dashboard-map-subtitle">
                Select a card or marker to see lot details and availability.
              </p>
              <MapView
                spot={selectedSpot}
                spots={filteredSpots}
                onSelectSpot={setSelectedSpot}
              />
            </div>
          </aside>
        </div>
      ) : null}
      </div>
    </>
  );
}

export default DashboardPage;