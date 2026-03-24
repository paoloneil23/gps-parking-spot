import { useNavigate } from "react-router-dom";
import "./EntryPage.css";
import parkingImage from "../assets/entrypagepic.jpg";

function EntryPage() {
  const navigate = useNavigate();

  return (
    <div className="entry-page">
      <div className="entry-card">
        
        <img
          src={parkingImage}
          alt="Parking Illustration"
          className="entry-image"
        />

        <h1 className="entry-title">GPS Parking</h1>

        <p className="entry-subtitle">
          Find, reserve, and navigate to available parking spots easily.
        </p>

        <div className="entry-buttons">
          <button
            className="btn primary"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            className="btn secondary"
            onClick={() => navigate("/register")}
          >
            Sign Up
          </button>

          <button
            className="btn ghost"
            onClick={() => navigate("/guest")}
          >
            Continue as Guest
          </button>
        </div>

      </div>
    </div>
  );
}

export default EntryPage;