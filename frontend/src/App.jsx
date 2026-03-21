import "./App.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import EntryPage from "./pages/EntryPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SearchParkingPage from "./pages/SearchParkingPage";
import ParkingResultsPage from "./pages/ParkingResultsPage";
import GuestAccessPage from "./pages/GuestAccessPage";
import GuestParkingPage from "./pages/GuestParkingPage";
import DashboardPage from "./pages/DashboardPage";
import ParkingTypePage from "./pages/ParkingTypePage";
import NavigationPage from "./pages/NavigationPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ManageParkingSpotsPage from "./pages/ManageParkingSpotsPage";
import RegistrationSuggestionPage from "./pages/RegistrationSuggestionPage";

function App() {
  return (
    <BrowserRouter>
      <div className="app">

        <Routes>
          <Route path="/" element={<EntryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<SignupPage />} />
          <Route path="/search" element={<SearchParkingPage />} />
          <Route path="/results" element={<ParkingResultsPage />} />
          <Route path="/guest" element={<GuestAccessPage />} />
          <Route path="/guest-parking" element={<GuestParkingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/parking-type" element={<ParkingTypePage />} />
          <Route path="/navigation" element={<NavigationPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/manage" element={<ManageParkingSpotsPage />} />
          <Route path="/register-suggestion" element={<RegistrationSuggestionPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;