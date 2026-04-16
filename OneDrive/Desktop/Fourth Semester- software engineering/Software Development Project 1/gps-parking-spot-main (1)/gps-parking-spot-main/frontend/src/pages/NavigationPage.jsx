import { useLocation, useNavigate } from "react-router-dom";
import "./NavigationPage.css";
import parkingImage from "../assets/entrypagepic.jpg";

function NavigationPage() {
  const navigate = useNavigate();
  const currentLocation = useLocation();

  const selectedSpot = currentLocation.state?.spot || {
    name: "Airport Parking",
    location: "Toronto",
    distance: "5 minute drive",
    type: "EV",
    address: "6301 Silver Dart Dr, Mississauga, ON",
  };

  return (
    <div className="navigation-page">
      <div className="navigation-card">
        <img
          src={parkingImage}
          alt="Navigation"
          className="navigation-image"
        />

        <h1 className="navigation-title">Drive to Your Parking Spot</h1>

        <p className="navigation-subtitle">
          Follow the route below to reach your selected parking location.
        </p>

        <div className="navigation-info">
          <div className="info-box">
            <h3>Parking Spot</h3>
            <p>{selectedSpot.name}</p>
          </div>

          <div className="info-box">
            <h3>Address</h3>
            <p>{selectedSpot.address}</p>
          </div>

          <div className="info-box">
            <h3>Estimated Time</h3>
            <p>{selectedSpot.distance}</p>
          </div>

          <div className="info-box">
            <h3>Parking Type</h3>
            <p>{selectedSpot.type}</p>
          </div>
        </div>

        <div className="map-placeholder">
          <div className="map-route">
            <div className="route-start">You</div>
            <div className="route-line"></div>
            <div className="route-end">Parking</div>
          </div>
          <p className="map-text">Map View Placeholder</p>
        </div>

        <div className="navigation-buttons">
          <button className="btn primary">Start Navigation</button>

          <button
            className="btn secondary"
            onClick={() => navigate("/parking-results")}
          >
            Back to Results
          </button>
        </div>
      </div>
    </div>
  );
}

export default NavigationPage;