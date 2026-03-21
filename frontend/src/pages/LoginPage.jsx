import "./LoginPage.css";
import { useNavigate } from "react-router-dom";
import loginImage from "../assets/loginpagepic.jpg";

function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={loginImage} alt="Login Illustration" className="login-image"/>
        <h1 className="login-title">Welcome Back</h1>
        <p className="login-subtitle">Log in to access GPS Parking.</p>

        <form className="login-form">
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />

          <div className="login-options">
            <label className="remember-me">
              <input type="checkbox" />
              Remember Me
            </label>

            <button type="button" className="forgot-link">
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="login-button">
            Login
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
          onClick={() => navigate("/")}
        >
          Back
        </button>
      </div>
    </div>
  );
}

export default LoginPage;