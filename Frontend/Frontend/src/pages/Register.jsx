import React, { useState } from "react";;
import { api } from "../api/api";
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function Register({ goHome, onRegistered }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [type, setType] = useState("owner");
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");

    try {
      const endpoint =
        type === "owner"
          ? "/users/users/register-owner"
          : "/users/users/register-user";

      await api.post(endpoint, {
        name,
        email,
        password,
      });

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      alert(`${type.toUpperCase()} registered successfully! Please login now.`);
      if (onRegistered) onRegistered();
    } catch (err) {
      const msg =
        err.response?.data?.detail?.[0]?.msg ||
        err.response?.data?.detail ||
        "Registration failed";
      alert(msg);
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
            SECURE ACCESS REGISTRATION
          </p>
        </div>

        <form onSubmit={handleRegister} className="p-6">
          {/* Role switch */}
          <div className="flex gap-2 mb-5">
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                type === "owner"
                  ? "bg-cyan-500 text-black"
                  : "bg-[#050b17] text-cyan-200 border border-cyan-400/30"
              }`}
              onClick={() => setType("owner")}
            >
              OWNER
            </button>
            <button
              type="button"
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                type === "user"
                  ? "bg-cyan-500 text-black"
                  : "bg-[#050b17] text-cyan-200 border border-cyan-400/30"
              }`}
              onClick={() => setType("user")}
            >
              USER
            </button>
          </div>

          <input
            className="w-full mb-3 px-4 py-2 rounded-lg bg-[#050b17] border border-cyan-400/30 text-cyan-100"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            className="w-full mb-3 px-4 py-2 rounded-lg bg-[#050b17] border border-cyan-400/30 text-cyan-100"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Password */}
          <div className="relative mb-3">
            <input
              className="w-full px-4 py-2 rounded-lg bg-[#050b17] border border-cyan-400/30 text-cyan-100 pr-10"
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300 hover:text-cyan-400"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative mb-2">
            <input
              className="w-full px-4 py-2 rounded-lg bg-[#050b17] border border-cyan-400/30 text-cyan-100 pr-10"
              placeholder="Confirm Password"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300 hover:text-cyan-400"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          <button className="w-full py-3 rounded-xl font-bold tracking-widest bg-gradient-to-r from-cyan-400 to-purple-500 text-black">
            REGISTER
          </button>
        </form>

        <div className="pb-6 text-center">
          <button
            type="button"
            onClick={goHome}
            className="text-cyan-300 text-xs hover:text-cyan-400"
          >
            ← BACK TO HOME
          </button>
        </div>
      </div>
    </div>
  );
}
