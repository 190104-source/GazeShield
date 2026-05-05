import React, { useState } from "react";;
import FrontPage from "./pages/home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import RegisterFace from "./pages/RegisterFace";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [page, setPage] = useState("home");
  const [userId, setUserId] = useState(null);

  //  After login → decide where to go
  const handleLoginSuccess = (id, nextPage) => {
    localStorage.setItem("user_id", id);
    setUserId(id);
    setPage(nextPage);
  };

  //  After account registration
  const handleAccountRegistered = () => {
    setPage("login");
  };

  //  Logout handler
  const handleLogout = () => {
    localStorage.clear();
    setUserId(null);
    setPage("home");
  };

  return (
    <>
      {page === "home" && (
        <FrontPage
          onRegister={() => setPage("register")}
          onLogin={() => setPage("login")}
        />
      )}

      {page === "register" && (
        <Register
          goHome={() => setPage("home")}
          onRegistered={handleAccountRegistered}
        />
      )}

      {page === "login" && (
        <Login
          goHome={() => setPage("home")}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      {page === "register-face" && (
        <RegisterFace
          goHome={() => setPage("home")}
          onRegistered={() => setPage("dashboard")}
        />
      )}

      {page === "dashboard" && (
        <Dashboard
          userId={userId}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
