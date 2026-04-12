import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getApiBase, parseResponseSafely } from "../utils/api";
import "./AdminDashboardPage.css";

const API_BASE = getApiBase();

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [spots, setSpots] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      setLoadingStats(true);

      try {
        const response = await fetch(`${API_BASE}/api/parking/live`);
        const data = await parseResponseSafely(response);

        if (response.ok && isMounted) {
          setSpots(Array.isArray(data) ? data : []);
        }
      } finally {
        if (isMounted) {
          setLoadingStats(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = spots.length;
    const available = spots.filter((spot) => {
      if (typeof spot.availableSpots === "number") {
        return spot.availableSpots > 0;
      }

      return spot.isAvailable !== false;
    }).length;
    const occupied = Math.max(total - available, 0);
    const free = spots.filter(
      (spot) => spot.isPaid === false || (typeof spot.pricePerHour === "number" && spot.pricePerHour <= 0)
    ).length;

    return { total, available, occupied, free };
  }, [spots]);

  return (
    <>
      <Navbar userName="Admin" />

      <div className="admin-page">
        <div className="admin-container">
          <header className="admin-header">
            <div>
              <p className="admin-tag">Admin Panel</p>
              <h1 className="admin-title">Admin Dashboard</h1>
              <p className="admin-subtitle">
                Monitor parking activity and manage the system.
              </p>
            </div>
          </header>

          <section className="admin-stats">
            <div className="stat-card">
              <h3>Total Spots</h3>
              <p>{loadingStats ? "..." : stats.total}</p>
            </div>

            <div className="stat-card">
              <h3>Available</h3>
              <p>{loadingStats ? "..." : stats.available}</p>
            </div>

            <div className="stat-card">
              <h3>Occupied</h3>
              <p>{loadingStats ? "..." : stats.occupied}</p>
            </div>

            <div className="stat-card">
              <h3>Free Spots</h3>
              <p>{loadingStats ? "..." : stats.free}</p>
            </div>
          </section>

          <section className="admin-main-grid">
            <div className="admin-card">
              <h2>Quick Actions</h2>
              <div className="action-grid">
                <button onClick={() => navigate("/manage")}>Manage Parking Spots</button>
                <button onClick={() => navigate("/manage")}>Add New Spot</button>
                <button onClick={() => navigate("/admin/users")}>Browse Users</button>
                <button onClick={() => navigate("/dashboard")}>View User Dashboard</button>
              </div>
            </div>

            <div className="admin-card">
              <h2>System Overview</h2>
              <ul className="overview-list">
                <li>Peak usage time: 9 AM - 11 AM</li>
                <li>Most used area: Zone A</li>
                <li>Pending maintenance: 3 spots</li>
                <li>New users today: 8</li>
              </ul>
            </div>
          </section>

          <section className="admin-card">
            <h2>Recent Activity</h2>

            <div className="table-wrapper">
              <table className="activity-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Spot</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>John Doe</td>
                    <td>Reserved Spot</td>
                    <td>A12</td>
                    <td>10:15 AM</td>
                  </tr>
                  <tr>
                    <td>Mary Smith</td>
                    <td>Checked In</td>
                    <td>B08</td>
                    <td>10:42 AM</td>
                  </tr>
                  <tr>
                    <td>Alex Cruz</td>
                    <td>Cancelled Reservation</td>
                    <td>C03</td>
                    <td>11:05 AM</td>
                  </tr>
                  <tr>
                    <td>Sarah Kim</td>
                    <td>Added to Waitlist</td>
                    <td>D11</td>
                    <td>11:18 AM</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default AdminDashboardPage;