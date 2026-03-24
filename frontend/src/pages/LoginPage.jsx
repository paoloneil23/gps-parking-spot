import "./LoginPage.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import loginImage from "../assets/loginpagepic.jpg";

function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      const storage = formData.rememberMe ? localStorage : sessionStorage;
      storage.setItem("token", data.token);
      storage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (err) {
      setError("Unable to reach server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={loginImage} alt="Login Illustration" className="login-image"/>
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Log in to access GPS Parking.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <div className="login-options">
            <label className="remember-me">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              Remember Me
            </label>

            <button type="button" className="forgot-link">
              Forgot Password?
            </button>
          </div>

          {error ? <p style={{ color: "#c0392b", margin: 0 }}>{error}</p> : null}

          <button type="submit" className="login-button" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-divider">or</div>

        <button
          type="button"
          className="signup-button"
          onClick={() => navigate("/register")}
        >
          Create an Account
        </button>

        <button
          type="button"
          className="guest-button"
          onClick={() => navigate("/guest")}
        >
          Continue as Guest
        </button>

        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/entry")}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default LoginPage;