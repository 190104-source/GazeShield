import React, { useState } from "react";;
import { api } from "../api/api";
import { jwtDecode } from "jwt-decode";

export default function Login({ goHome, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // OAuth2 requires form-data (NOT JSON)
      const form = new FormData();
      form.append("username", email);   // email acts as username
      form.append("password", password);

      const res = await api.post("/token", form, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const token = res.data.access_token;

      // Store token
      localStorage.setItem("access_token", token);

      // Decode JWT → extract userId
      const decoded = jwtDecode(token);
      localStorage.setItem("user_id", decoded.sub);

      alert("Login successful ✅");
      // 🔑 get userId
      const userId = decoded.sub;
      // 🔍 check face registration status
      const faceRes = await api.get(`/users/${userId}/face-status`);
      if (faceRes.data.registered) {
        onLoginSuccess(userId,"dashboard");
      } else {
        onLoginSuccess(userId,"register-face");
      }




    } catch (err) {
      console.error(err);
      alert("Invalid credentials ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#050b17] via-[#0b1c2f] to-black flex items-center justify-center px-4">

      <div className="relative w-full max-w-md rounded-2xl border border-cyan-500/30 bg-[#0a1930]/90 shadow-[0_0_40px_rgba(79,245,255,0.15)]">

        {/* Header */}
        <div className="text-center py-6 border-b border-cyan-400/20">
          <div className="text-4xl mb-2">🛡️</div>
          <h1 className="text-3xl font-bold tracking-wider text-cyan-300">
            GazeShield
          </h1>
          <p className="text-xs tracking-widest text-cyan-200/70 mt-1">
            SECURE ACCESS LOGIN
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-6">

          <input
            className="w-full mb-4 px-4 py-2 rounded-lg bg-[#050b17] border border-cyan-400/30 text-cyan-100 placeholder-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="w-full mb-6 px-4 py-2 rounded-lg bg-[#050b17] border border-cyan-400/30 text-cyan-100 placeholder-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold tracking-widest bg-gradient-to-r from-cyan-400 to-purple-500 text-black shadow-[0_0_25px_rgba(79,245,255,0.4)] hover:scale-[1.02] transition disabled:opacity-60"
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={goHome}
              className="text-cyan-300 text-sm tracking-widest hover:text-cyan-400 transition"
            >
              ← BACK TO HOME
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}