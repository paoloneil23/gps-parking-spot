import { useNavigate } from "react-router-dom";
import "./GuestAccessPage.css";
import parkingImage from "../assets/entrypagepic.jpg";

function GuestAccessPage() {
  const navigate = useNavigate();

  return (
    <div className="guest-page">
      <div className="guest-glow guest-glow-top" aria-hidden="true" />
      <div className="guest-glow guest-glow-bottom" aria-hidden="true" />

      <div className="guest-card">
        <p className="guest-badge">Guest mode</p>

        <img
          src={parkingImage}
          alt="Parking Illustration"
          className="guest-image"
        />

        <h1 className="guest-title">Guest Access</h1>

        <p className="guest-subtitle">
          Continue without creating an account. You can search and view parking
          spots, but some features may be limited.
        </p>

        <div className="guest-feature-list" aria-label="Guest features">
          <p>Live parking search</p>
          <p>Price and location filters</p>
          <p>Guest-friendly navigation flow</p>
        </div>

        <button
          type="button"
          className="guest-btn guest-btn-primary"
          onClick={() => navigate("/search")}
        >
          Continue as Guest
        </button>

        <button
          type="button"
          className="guest-btn guest-btn-map"
          onClick={() => navigate("/guest-parking", { state: { from: "/guest" } })}
        >
          View Parking Map
        </button>

        <div className="guest-divider">or</div>

        <button
          type="button"
          className="guest-btn guest-btn-secondary"
          onClick={() => navigate("/register")}
        >
          Create Account
        </button>

        <button
          type="button"
          className="guest-btn guest-btn-soft"
          onClick={() => navigate("/login")}
        >
          Login
        </button>

        <button
          type="button"
          className="guest-btn guest-btn-ghost"
          onClick={() => navigate("/entry")}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default GuestAccessPage;