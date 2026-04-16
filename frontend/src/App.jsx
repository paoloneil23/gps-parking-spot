import "./App.css";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import EntryPage from "./pages/EntryPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SearchParkingPage from "./pages/SearchParkingPage";
import ParkingResultsPage from "./pages/ParkingResultsPage";
import GuestAccessPage from "./pages/GuestAccessPage";
import GuestParkingPage from "./pages/GuestParkingPage";
import DashboardPage from "./pages/DashboardPage";
import BookingHistoryPage from "./pages/BookingHistoryPage";
import ProfilePage from "./pages/ProfilePage";
import ParkingTypePage from "./pages/ParkingTypePage";
import NavigationPage from "./pages/NavigationPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ManageParkingSpotsPage from "./pages/ManageParkingSpotsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import RegistrationSuggestionPage from "./pages/RegistrationSuggestionPage";

const getStoredUser = () => {
  const tokenStorage = sessionStorage.getItem("token")
    ? sessionStorage
    : localStorage.getItem("token")
      ? localStorage
      : null;
  const rawUser = tokenStorage?.getItem("user") || null;
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

const isAuthenticated = () => {
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  return Boolean(token);
};

const isAdmin = () => {
  const user = getStoredUser();
  return (user?.role || "").toString().toLowerCase() === "admin";
};

const getPostLoginRoute = () => (isAdmin() ? "/admin" : "/dashboard");

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function PublicOnlyRoute({ children }) {
  return isAuthenticated() ? <Navigate to={getPostLoginRoute()} replace /> : children;
}

function AdminOnlyRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return isAdmin() ? children : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated() ? (
                <Navigate to={getPostLoginRoute()} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/entry" element={<EntryPage />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <LoginPage />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <SignupPage />
              </PublicOnlyRoute>
            }
          />
          <Route path="/search" element={<SearchParkingPage />} />
          <Route path="/parking-results" element={<ParkingResultsPage />} />
          <Route path="/guest" element={<GuestAccessPage />} />
          <Route path="/guest-parking" element={<GuestParkingPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <BookingHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/parking-type" element={<ParkingTypePage />} />
          <Route path="/navigation" element={<NavigationPage />} />
          <Route
            path="/admin"
            element={
              <AdminOnlyRoute>
                <AdminDashboardPage />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/manage"
            element={
              <AdminOnlyRoute>
                <ManageParkingSpotsPage />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminOnlyRoute>
                <AdminUsersPage />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/register-suggestion"
            element={<RegistrationSuggestionPage />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;