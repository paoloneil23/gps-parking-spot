import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getApiBase, parseResponseSafely } from "../utils/api";
import "./ProfilePage.css";

const API_BASE = getApiBase();

function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [preferences, setPreferences] = useState([]);
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    carType: "",
    carBrand: "",
    carModel: "",
    plateNumber: "",
    color: "",
    password: "",
  });

  const storedUser = useMemo(() => {
    const rawUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser);
    } catch {
      return null;
    }
  }, []);

  const userId = storedUser?.id || storedUser?._id || storedUser?.userId || "";

  const persistUser = (nextUser) => {
    const tokenStorage = sessionStorage.getItem("token") ? sessionStorage : localStorage;
    tokenStorage.setItem("user", JSON.stringify(nextUser));
  };

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!userId) {
        setError("Please login to view your profile.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/profile/${userId}`);
        const data = await parseResponseSafely(response);

        if (!response.ok) {
          throw new Error(data.message || "Failed to load profile.");
        }

        if (isMounted) {
          setProfile({
            fullName: data.user?.fullName || "",
            email: data.user?.email || "",
            phoneNumber: data.user?.phoneNumber || "",
            carType: data.user?.carType || "",
            carBrand: data.user?.carBrand || "",
            carModel: data.user?.carModel || data.user?.carDetails?.carModel || "",
            plateNumber: data.user?.plateNumber || data.user?.carDetails?.plateNumber || data.user?.carPlateNumber || "",
            color: data.user?.color || data.user?.carDetails?.color || data.user?.carColor || "",
            password: "",
          });
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load profile.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    const loadPreferences = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`${API_BASE}/api/preferences/${userId}`);
        const data = await parseResponseSafely(response);

        if (response.ok && isMounted) {
          const preferencesList = Array.isArray(data.preferencesList)
            ? data.preferencesList
            : data.preferences
              ? [data.preferences]
              : [];
          setPreferences(preferencesList);
        }
      } catch (err) {
        // Silently handle preference loading error
      }
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userId) {
      setError("Please login to update your profile.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        userId,
        fullName: profile.fullName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        carType: profile.carType,
        carBrand: profile.carBrand,
        carModel: profile.carModel,
        plateNumber: profile.plateNumber,
        color: profile.color,
      };

      if (profile.password.trim()) {
        payload.password = profile.password;
      }

      const response = await fetch(`${API_BASE}/api/auth/profile/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await parseResponseSafely(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }

      persistUser(data.user);
      setProfile((prev) => ({ ...prev, password: "" }));
      setMessage(data.message || "Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const formatMaxPrice = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "No limit";
    }

    return `$${Number(value)}`;
  };

  const formatPreferenceTypes = (types) => {
    if (!Array.isArray(types) || types.length === 0) {
      return "Any";
    }

    return types.join(", ");
  };

  return (
    <>
      <Navbar userName={profile.fullName || storedUser?.fullName || "User"} />
      <div className="profile-page">
        <div className="profile-container">
          <header className="profile-header">
            <div>
              <p className="profile-tag">Home</p>
              <h1>Profile</h1>
              <p>Update your personal details and vehicle information.</p>
            </div>
            <button type="button" className="back-home-btn" onClick={() => navigate("/dashboard")}>
              Back to Main Page
            </button>
          </header>

          {message ? <p className="profile-message success">{message}</p> : null}
          {error ? <p className="profile-message error">{error}</p> : null}

          <section className="profile-card">
            {loading ? (
              <p className="profile-empty">Loading profile...</p>
            ) : (
              <div className="profile-layout-grid">
                <aside className="profile-sidebar">
                  <div className="profile-summary-card">
                    <h3>Car Details Summary</h3>
                    <div className="summary-line">
                      <span className="summary-label">Type</span>
                      <strong>{profile.carType || "Not set"}</strong>
                    </div>
                    <div className="summary-line">
                      <span className="summary-label">Brand</span>
                      <strong>{profile.carBrand || "Not set"}</strong>
                    </div>
                    <div className="summary-line">
                      <span className="summary-label">Model</span>
                      <strong>{profile.carModel || "Not set"}</strong>
                    </div>
                    <div className="summary-line">
                      <span className="summary-label">Plate</span>
                      <strong>{profile.plateNumber || "Not set"}</strong>
                    </div>
                    <div className="summary-line">
                      <span className="summary-label">Color</span>
                      <strong>{profile.color || "Not set"}</strong>
                    </div>
                  </div>

                  {preferences.length > 0 ? (
                    <div className="profile-summary-card preferences-card">
                      <h3>Parking Preferences</h3>
                      <div className="profile-preferences-list">
                        {preferences.map((entry, index) => (
                          <div className="profile-preference-block" key={`${entry.savedAt || "na"}-${index}`}>
                            <div className="summary-line preference-block-title">
                              <span className="summary-label">Preference #{preferences.length - index}</span>
                              <strong className="summary-value">
                                {entry.savedAt ? new Date(entry.savedAt).toLocaleString() : "Saved"}
                              </strong>
                            </div>
                            <div className="summary-line">
                              <span className="summary-label">Max Price</span>
                              <strong className="summary-value">{formatMaxPrice(entry.maxPrice)}</strong>
                            </div>
                            <div className="summary-line">
                              <span className="summary-label">Only Available</span>
                              <strong className={`summary-pill ${entry.onlyAvailable ? "is-yes" : "is-no"}`}>
                                {entry.onlyAvailable ? "Yes" : "No"}
                              </strong>
                            </div>
                            <div className="summary-line">
                              <span className="summary-label">Free Only</span>
                              <strong className={`summary-pill ${entry.freeOnly ? "is-yes" : "is-no"}`}>
                                {entry.freeOnly ? "Yes" : "No"}
                              </strong>
                            </div>
                            <div className="summary-line">
                              <span className="summary-label">Parking Types</span>
                              <strong className="summary-value">{formatPreferenceTypes(entry.parkingType)}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </aside>

                <form className="profile-form" onSubmit={handleSubmit}>
                  <section className="profile-section">
                    <h3>Personal Information</h3>
                    <div className="profile-grid-two">
                      <label>
                        Name
                        <input type="text" name="fullName" value={profile.fullName} onChange={handleChange} required />
                      </label>
                      <label>
                        Email Address
                        <input type="email" name="email" value={profile.email} onChange={handleChange} required />
                      </label>
                      <label>
                        Phone Number
                        <input type="text" name="phoneNumber" value={profile.phoneNumber} onChange={handleChange} />
                      </label>
                    </div>
                  </section>

                  <section className="profile-section">
                    <h3>Car Details</h3>
                    <div className="profile-grid-two">
                      <label>
                        Type of Car
                        <input type="text" name="carType" value={profile.carType} onChange={handleChange} placeholder="Sedan, SUV, Hatchback..." />
                      </label>
                      <label>
                        Car Brand
                        <input type="text" name="carBrand" value={profile.carBrand} onChange={handleChange} placeholder="Toyota, Honda, BMW..." />
                      </label>
                      <label>
                        Car Model
                        <input type="text" name="carModel" value={profile.carModel} onChange={handleChange} placeholder="Corolla, Civic, X5..." />
                      </label>
                      <label>
                        Plate Number
                        <input type="text" name="plateNumber" value={profile.plateNumber} onChange={handleChange} placeholder="ABC-1234" />
                      </label>
                      <label>
                        Car Color
                        <input type="text" name="color" value={profile.color} onChange={handleChange} placeholder="Black, White, Red..." />
                      </label>
                    </div>
                  </section>

                  <section className="profile-section">
                    <h3>Security</h3>
                    <div className="profile-grid-two">
                      <label>
                        New Password
                        <input type="password" name="password" value={profile.password} onChange={handleChange} placeholder="Leave blank to keep current password" />
                      </label>
                    </div>
                  </section>

                  <div className="profile-actions">
                    <button type="submit" className="profile-save-btn" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

export default ProfilePage;
