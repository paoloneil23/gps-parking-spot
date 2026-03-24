import "./SignupPage.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import signupImage from "../assets/signuppage.jpg";

function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError("This email already exists. Use another email for a new user.");
        } else {
          setError(data.message || "Failed to create account");
        }
        return;
      }

      setSuccess("Account created successfully. Redirecting to login...");
      setFormData({ fullName: "", email: "", password: "", confirmPassword: "" });
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError("Unable to reach server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">

        <img
          src={signupImage}
          alt="Sign Up"
          className="signup-image"
        />

        <h1 className="signup-title">Create Account</h1>
        <p className="signup-subtitle">
          Sign up to start using GPS Parking.
        </p>

        <form className="signup-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            placeholder="Username"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
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
            minLength={6}
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={6}
          />

          {error ? <p style={{ color: "#c0392b", margin: 0 }}>{error}</p> : null}
          {success ? <p style={{ color: "#1f7a3f", margin: 0 }}>{success}</p> : null}

          <button type="submit" className="signup-button" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <div className="signup-divider">or</div>

        <button
          className="login-redirect"
          onClick={() => navigate("/login")}
        >
          Already have an account?
        </button>

        <button
          className="guest-button"
          onClick={() => navigate("/guest")}
        >
          Continue as Guest
        </button>

        <button
          className="back-button"
          onClick={() => navigate("/")}
        >
          Back
        </button>

      </div>
    </div>
  );
}

export default SignUpPage;