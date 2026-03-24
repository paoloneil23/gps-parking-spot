import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchParkingPage.css";
import parkingImage from "../assets/entrypagepic.jpg";

function SearchParkingPage() {
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [error, setError] = useState("");

  const handleSearch = () => {
    if (!location.trim()) {
      setError("Please enter a location to search.");
      return;
    }

    setError("");

    navigate(
      `/parking-results?location=${encodeURIComponent(
        location.trim()
      )}&maxPrice=${encodeURIComponent(maxPrice)}`
    );
  };

  const setQuickPrice = (value) => {
    setMaxPrice(String(value));
  };

  return (
    <div className="search-page">
      <div className="search-glow search-glow-top" aria-hidden="true" />
      <div className="search-glow search-glow-bottom" aria-hidden="true" />

      <div className="search-card">
        <img src={parkingImage} alt="Parking" className="search-image" />

        <h2 className="search-title">Find Parking Fast</h2>
        <p className="search-subtitle">
          Search by location and choose your budget to see available parking
          spots nearby.
        </p>

        <div className="search-form">
          <input
            className="search-input"
            type="text"
            placeholder="Enter location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <input
            className="search-input"
            type="number"
            min="0"
            placeholder="Max price (optional)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />

          <div className="quick-price-row" aria-label="Quick price filters">
            <button type="button" onClick={() => setQuickPrice(5)}>
              {"<= 5"}
            </button>
            <button type="button" onClick={() => setQuickPrice(10)}>
              {"<= 10"}
            </button>
            <button type="button" onClick={() => setQuickPrice(15)}>
              {"<= 15"}
            </button>
          </div>

          {error ? <p className="search-error">{error}</p> : null}

          <button type="button" className="search-btn search-btn-primary" onClick={handleSearch}>
            Search Parking
          </button>

          <button
            type="button"
            className="search-btn search-btn-map"
            onClick={() => navigate("/guest-parking", { state: { from: "/search" } })}
          >
            View Map
          </button>

          <button
            type="button"
            className="search-btn search-btn-ghost"
            onClick={() => navigate("/guest")}
          >
            Back to Guest Page
          </button>
        </div>
      </div>
    </div>
  );
}

export default SearchParkingPage;