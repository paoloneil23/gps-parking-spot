import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ParkingCard from "../components/ParkingCard";
import MapView from "../components/MapView";
import Navbar from "../components/Navbar";
import ParkingTypeFilter from "../components/ParkingTypeFilter";
import { getApiBase, parseResponseSafely } from "../utils/api";
import "./DashboardPage.css";

const API_BASE = getApiBase();

function DashboardPage() {
  const navigate = useNavigate();
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
  const [savedPreferences, setSavedPreferences] = useState([]);
  const [preferencesMessage, setPreferencesMessage] = useState("");
  const [preferencesError, setPreferencesError] = useState("");
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const userData = useMemo(() => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  }, []);

  const userDisplayName = useMemo(() => {
    return userData?.fullName || userData?.email || "User";
  }, [userData]);

  const isAdminUser = useMemo(() => {
    return (userData?.role || "").toString().toLowerCase() === "admin";
  }, [userData]);

  const getCurrentUserId = useCallback(() => {
    return userData?.id || userData?._id || userData?.userId || "";
  }, [userData]);

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

  const selectedSpotReservedForRoles = Array.isArray(selectedSpot?.reservedForRoles)
    ? selectedSpot.reservedForRoles
    : [];

  const isSelectedSpotRestricted =
    Boolean(selectedSpot?.isReserved) &&
    selectedSpotReservedForRoles.length > 0 &&
    !selectedSpotReservedForRoles.includes(isAdminUser ? "admin" : "user");

  const canReserveSelectedSpot =
    Boolean(selectedSpot) &&
    selectedAvailableSpots > 0 &&
    !isSelectedSpotRestricted;

  const loadPreferences = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setSavedPreferences([]);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/preferences/${userId}`);
      const data = await parseResponseSafely(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to load preferences.");
      }

      const preferencesList = Array.isArray(data.preferencesList)
        ? data.preferencesList
        : data.preferences
          ? [data.preferences]
          : [];

      setSavedPreferences(preferencesList);

      const latestPreference = preferencesList[0] || null;

      if (latestPreference) {
        setMaxPrice(
          latestPreference.maxPrice === null || latestPreference.maxPrice === undefined
            ? ""
            : String(latestPreference.maxPrice)
        );
        setOnlyAvailable(Boolean(latestPreference.onlyAvailable));
        setOnlyFree(Boolean(latestPreference.freeOnly));
        setSelectedParkingTypes(
          Array.isArray(latestPreference.parkingType) ? latestPreference.parkingType : []
        );
      }
    } catch (err) {
      setPreferencesError(err.message || "Unable to load preferences.");
    }
  }, [getCurrentUserId]);

  const handleSavePreferences = async (preferredType) => {
    const userId = getCurrentUserId();
    if (!userId) {
      setPreferencesError("Please login to save preferences.");
      return;
    }

    setIsSavingPreferences(true);
    setPreferencesError("");
    setPreferencesMessage("");

    const preferredParkingTypes =
      selectedParkingTypes.length > 0
        ? selectedParkingTypes
        : preferredType
          ? [preferredType]
          : [];

    try {
      const response = await fetch(`${API_BASE}/api/preferences/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          maxPrice: maxPrice === "" ? null : Number(maxPrice),
          onlyAvailable,
          freeOnly: onlyFree,
          parkingType: preferredParkingTypes,
        }),
      });

      const data = await parseResponseSafely(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to save preferences.");
      }

      const preferencesList = Array.isArray(data.preferencesList)
        ? data.preferencesList
        : data.preferences
          ? [data.preferences]
          : [];

      setSavedPreferences(preferencesList);
      setPreferencesMessage(data.message || "Preferences saved for next visit.");
    } catch (err) {
      setPreferencesError(err.message || "Unable to save preferences.");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleRemovePreferences = async () => {
    const userId = getCurrentUserId();
    if (!userId) {
      setPreferencesError("Please login to remove preferences.");
      return;
    }

    setIsSavingPreferences(true);
    setPreferencesError("");
    setPreferencesMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/preferences/${userId}`, {
        method: "DELETE",
      });

      const data = await parseResponseSafely(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove preferences.");
      }

      setSavedPreferences([]);
      setMaxPrice("");
      setOnlyAvailable(false);
      setOnlyFree(false);
      setSelectedParkingTypes([]);
      setPreferencesMessage(data.message || "Preferences removed.");
    } catch (err) {
      setPreferencesError(err.message || "Unable to remove preferences.");
    } finally {
      setIsSavingPreferences(false);
    }
  };

  useEffect(() => {
    fetchSpots();
    loadPreferences();
  }, [fetchSpots, loadPreferences]);

  const handleReserveSpot = async () => {
    if (!selectedSpot?._id || isReserving) {
      return;
    }

    if (isSelectedSpotRestricted) {
      setReservationError("This parking spot is reserved for admin users only.");
      setReservationMessage("");
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

      const data = await parseResponseSafely(response);

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

      const data = await parseResponseSafely(response);

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

  const formatSavedPreferenceTypes = (types) => {
    if (!Array.isArray(types) || types.length === 0) {
      return "Any";
    }

    return types.join(", ");
  };

  const formatPreferencePrice = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "No limit";
    }

    return `$${Number(value)}`;
  };

  return (
    <>
      <Navbar userName={userDisplayName} />
      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <h1>Home Page</h1>
            <p className="dashboard-user-name">Welcome, {userDisplayName}</p>
            <p>Live parking information loaded from your MongoDB database.</p>
            <p className="dashboard-realtime-status">
              <span className={`realtime-dot ${isRefreshing ? "syncing" : "live"}`} />
              {isRefreshing ? "Syncing latest data..." : "Manual updates only"}
              {lastUpdated ? ` • Last updated ${lastUpdated.toLocaleTimeString()}` : ""}
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

          {isAdminUser ? (
            <button
              type="button"
              className="back-admin-btn dashboard-back-btn"
              onClick={() => navigate("/admin")}
            >
              Back to Admin Dashboard
            </button>
          ) : null}

          <button
            type="button"
            className="refresh-btn dashboard-secondary-btn"
            onClick={() => navigate("/history")}
          >
            Booking History
          </button>

          <button
            type="button"
            className="refresh-btn dashboard-secondary-btn"
            onClick={() => navigate("/profile")}
          >
            Profile
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
                    onSavePreference={() => handleSavePreferences(spot.type || "regular")}
                  />
                ))
              )}
            </section>

            <aside>
              <div className="preferences-panel">
                <div className="dashboard-map-title-row">
                  <h3>Saved Preferences</h3>
                </div>

                <p className="dashboard-map-subtitle">
                  These settings are restored the next time you visit.
                </p>

                {savedPreferences.length > 0 ? (
                  <div className="preferences-history-list">
                    {savedPreferences.map((preference, index) => (
                      <div
                        className="preferences-details-list"
                        key={`${preference.savedAt || "na"}-${index}`}
                      >
                        <div className="preference-item preference-item-title">
                          <div className="preference-label">
                            Preference #{savedPreferences.length - index}
                          </div>
                          <div className="preference-value">
                            {preference.savedAt
                              ? new Date(preference.savedAt).toLocaleString()
                              : "Saved"}
                          </div>
                        </div>

                        <div className="preference-item">
                          <div className="preference-label">Max Price</div>
                          <div className="preference-value">
                            {formatPreferencePrice(preference.maxPrice)}
                          </div>
                        </div>

                        <div className="preference-item">
                          <div className="preference-label">Only Available Spots</div>
                          <div className="preference-value">
                            {preference.onlyAvailable ? "✓ Yes" : "✗ No"}
                          </div>
                        </div>

                        <div className="preference-item">
                          <div className="preference-label">Free Parking Only</div>
                          <div className="preference-value">
                            {preference.freeOnly ? "✓ Yes" : "✗ No"}
                          </div>
                        </div>

                        <div className="preference-item">
                          <div className="preference-label">Parking Types</div>
                          <div className="preference-value">
                            {formatSavedPreferenceTypes(preference.parkingType)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="preferences-empty">No preferences saved yet.</p>
                )}

                <div className="preferences-actions-row">
                  <button
                    type="button"
                    className="save-preferences-btn"
                    onClick={() => handleSavePreferences(selectedSpot?.type || "regular")}
                    disabled={isSavingPreferences}
                  >
                    {isSavingPreferences ? "Saving..." : "Save Current Preferences"}
                  </button>

                  <button
                    type="button"
                    className="unsave-preferences-btn"
                    onClick={handleRemovePreferences}
                    disabled={savedPreferences.length === 0 || isSavingPreferences}
                  >
                    Remove Saved Preferences
                  </button>
                </div>

                {preferencesMessage ? (
                  <p className="preferences-message success">{preferencesMessage}</p>
                ) : null}

                {preferencesError ? (
                  <p className="preferences-message error">{preferencesError}</p>
                ) : null}
              </div>

              <div className="reservation-actions-panel">
                <h3>Reserve & Pay</h3>
                <p>
                  {selectedSpot
                    ? `Selected: ${selectedSpot.lotName || selectedSpot.spotCode || "Parking Spot"}`
                    : "Select a spot to reserve."}
                </p>

                {selectedSpot?.isReserved ? (
                  <p className="reservation-error">
                    This spot is reserved
                    {selectedSpot.reservedForRoles?.length
                      ? ` for ${selectedSpot.reservedForRoles.join(", ")}`
                      : ""}.
                  </p>
                ) : null}

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
                    Reservation ID: {activeReservation._id} • Payment:{" "}
                    {activeReservation.paymentStatus}
                    {typeof activeReservation.amountDue === "number"
                      ? ` • Amount: $${activeReservation.amountDue.toFixed(2)}`
                      : ""}
                  </p>
                ) : null}

                {reservationMessage ? (
                  <p className="reservation-message">{reservationMessage}</p>
                ) : null}

                {reservationError ? (
                  <p className="reservation-error">{reservationError}</p>
                ) : null}
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