import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ParkingCard from "../components/ParkingCard";
import MapView from "../components/MapView";
import "./ParkingResultsPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function ParkingResultsPage() {
  const [parkingSpots, setParkingSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const locationHook = useLocation();
  const navigate = useNavigate();

  const fetchParkingSpots = useCallback(async ({ silent = false } = {}) => {
    const params = new URLSearchParams(locationHook.search);

    const location = params.get("location") || "";
    const maxPrice = params.get("maxPrice") || "";
    const freeOnly = params.get("freeOnly") || "0";

    if (!silent) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/parking/search?location=${encodeURIComponent(location)}&maxPrice=${encodeURIComponent(maxPrice)}&freeOnly=${encodeURIComponent(freeOnly)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch parking spots");
      }

      const data = await response.json();
      setParkingSpots(data);
      setLastUpdated(new Date());
      setSelectedSpot((prev) => {
        if (data.length === 0) {
          return null;
        }

        if (!prev) {
          return data[0];
        }

        const keep = data.find((spot) => spot._id === prev._id);
        return keep || data[0];
      });
    } catch (err) {
      setError(err.message || "Failed to fetch parking spots");
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setIsRefreshing(false);
    }
  }, [locationHook.search]);

  useEffect(() => {
    fetchParkingSpots();
  }, [fetchParkingSpots]);

  const params = useMemo(() => {
    return new URLSearchParams(locationHook.search);
  }, [locationHook.search]);
  
  const searchLocation = params.get("location") || "";
  const searchMaxPrice = params.get("maxPrice") || "";
  const freeOnlyEnabled = ["1", "true"].includes(
    (params.get("freeOnly") || "0").toLowerCase()
  );

  if (loading) return <div className="loading-container"><p>Loading parking spots...</p></div>;
  if (error) return <div className="error-container"><p>Error: {error}</p></div>;

  return (
    <div className="parking-results-page">
      <div className="results-header">
        <div>
          <button className="back-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h2>Search Results</h2>
          <p className="search-criteria">
            Location: <strong>{searchLocation}</strong>
            {searchMaxPrice && ` • Max Price: $${searchMaxPrice}/hr`}
            {freeOnlyEnabled ? " • Free parking only" : ""}
          </p>
          <p className="results-live-status">
            {isRefreshing ? "Syncing..." : "Manual updates only"}
            {lastUpdated ? ` • Last updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </p>
          <button
            type="button"
            className="manual-refresh-btn"
            onClick={() => fetchParkingSpots({ silent: true })}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Results"}
          </button>
        </div>
      </div>

      {parkingSpots.length === 0 ? (
        <p className="no-results">No parking spots found matching your criteria.</p>
      ) : (
        <div className="results-container">
          <section className="spots-list">
            <h3>Available Parking Lots ({parkingSpots.length})</h3>
            {parkingSpots.map((spot) => (
              <ParkingCard
                key={spot._id}
                spot={spot}
                isSelected={selectedSpot?._id === spot._id}
                onSelect={setSelectedSpot}
              />
            ))}
          </section>

          <aside className="results-map">
            <MapView
              spot={selectedSpot}
              spots={parkingSpots}
              onSelectSpot={setSelectedSpot}
            />
          </aside>
        </div>
      )}
    </div>
  );
}

export default ParkingResultsPage;