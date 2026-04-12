import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getApiBase, parseResponseSafely } from "../utils/api";
import "./AdminUsersPage.css";

const API_BASE = getApiBase();

function AdminUsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    let isMounted = true;

    const loadUsers = async () => {
      setLoading(true);
      setError("");

      try {
        const userId = getCurrentUserId();

        if (!userId) {
          throw new Error("Please login as admin to view users.");
        }

        const response = await fetch(`${API_BASE}/api/auth/users?userId=${encodeURIComponent(userId)}`);
        const data = await parseResponseSafely(response);

        if (!response.ok) {
          throw new Error(data.message || "Failed to load users.");
        }

        if (isMounted) {
          setUsers(Array.isArray(data.users) ? data.users : []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load users.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalAdmins = useMemo(
    () => users.filter((user) => (user.role || "").toLowerCase() === "admin").length,
    [users]
  );

  return (
    <>
      <Navbar userName="Admin" />

      <div className="admin-users-page">
        <div className="admin-users-container">
          <header className="admin-users-header">
            <div>
              <p className="admin-users-tag">Admin Panel</p>
              <h1>Browse Users</h1>
              <p>View all registered users and their roles.</p>
            </div>
            <button
              type="button"
              className="back-admin-btn"
              onClick={() => navigate("/admin")}
            >
              Back to Admin Dashboard
            </button>
          </header>

          <section className="admin-users-stats">
            <article className="admin-users-stat-card">
              <h3>Total Users</h3>
              <p>{loading ? "..." : users.length}</p>
            </article>
            <article className="admin-users-stat-card">
              <h3>Admins</h3>
              <p>{loading ? "..." : totalAdmins}</p>
            </article>
          </section>

          <section className="admin-users-table-card">
            {loading ? (
              <p className="admin-users-message">Loading users...</p>
            ) : error ? (
              <p className="admin-users-error">{error}</p>
            ) : users.length === 0 ? (
              <p className="admin-users-message">No users found.</p>
            ) : (
              <div className="admin-users-table-wrapper">
                <table className="admin-users-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.fullName || "-"}</td>
                        <td>{user.email || "-"}</td>
                        <td>{(user.role || "user").toLowerCase() === "admin" ? "Admin" : "User"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default AdminUsersPage;
