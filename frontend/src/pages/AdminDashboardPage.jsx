import Navbar from "../components/Navbar";
import "./AdminDashboardPage.css";

function AdminDashboardPage() {
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
              <p>120</p>
            </div>

            <div className="stat-card">
              <h3>Available</h3>
              <p>48</p>
            </div>

            <div className="stat-card">
              <h3>Occupied</h3>
              <p>72</p>
            </div>

            <div className="stat-card">
              <h3>Reservations Today</h3>
              <p>35</p>
            </div>
          </section>

          <section className="admin-main-grid">
            <div className="admin-card">
              <h2>Quick Actions</h2>
              <div className="action-grid">
                <button>Manage Parking Spots</button>
                <button>View Users</button>
                <button>Reports</button>
                <button>Add New Spot</button>
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