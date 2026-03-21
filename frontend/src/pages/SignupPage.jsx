import "./SignupPage.css";
import { useNavigate } from "react-router-dom";
import signupImage from "../assets/signuppage.jpg";

function SignUpPage() {
  const navigate = useNavigate();

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

        <form className="signup-form">
          <input type="text" placeholder="Full Name" />
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <input type="password" placeholder="Confirm Password" />

          <button type="submit" className="signup-button">
            Sign Up
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