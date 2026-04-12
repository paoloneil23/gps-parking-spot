import { useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar({ userName = "User" }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication from storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    // Redirect to login page
    navigate("/login", { replace: true });
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <h1>🅿️ GPS Parking Spot</h1>
        </div>

        <div className="navbar-user-section">
          <span className="navbar-user-name">Welcome, {userName}</span>
          <button className="navbar-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;