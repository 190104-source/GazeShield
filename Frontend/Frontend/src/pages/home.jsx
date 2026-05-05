import { motion } from "framer-motion";
import React, { useState } from "react";;
import {
  Shield,
  ScanFace,
  User,
  Eye,
  Users,
  Camera,
  Video,
  AlertTriangle,
  BookOpen,
} from "lucide-react";

export default function FrontPage({ onRegister, onLogin }) {
  const [activeMode, setActiveMode] = useState("Single");

  const modes = {
    Single:
      "Owner-only mode. Any unauthorized gaze triggers instant alerts, screen blur, and forensic logging.",
    Team:
      "Owner + trusted team members allowed. Outsiders automatically blocked.",
    Members:
      "All registered users permitted — ideal for shared devices or coworking spaces.",
    Exam:
      "Zero-tolerance for exams or sensitive tasks. Unauthorized access instantly blocked.",
  };

  const modeIcons = {
    Single: <Shield className="w-40 h-40 text-cyan-400" />,
    Team: <User className="w-40 h-40 text-cyan-400" />,
    Members: <Users className="w-40 h-40 text-cyan-400" />,
    Exam: <BookOpen className="w-40 h-40 text-cyan-400" />,
  };

  const flowSteps = [
    {
      icon: <ScanFace size={40} className="text-cyan-400" />,
      title: "Face Encoding",
      desc: "Securely captures and encrypts your facial data for authorized access.",
    },
    {
      icon: <User size={40} className="text-cyan-400" />,
      title: "Identity Verification",
      desc: "Recognizes only authorized users and ignores others to prevent leaks.",
    },
    {
      icon: <Eye size={40} className="text-cyan-400" />,
      title: "Gaze Tracking",
      desc: "Continuously monitors eyes and head movements to detect potential shoulder surfers.",
    },
    {
      icon: <Shield size={40} className="text-cyan-400" />,
      title: "Privacy Enforcement",
      desc: "Blurs screen, raises instant alerts, and logs evidence for secure review.",
    },
  ];

  return (
    <div className="font-sans text-white overflow-x-hidden">

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-black/70 backdrop-blur border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Shield className="w-12 h-12 text-cyan-400 animate-pulse" />
            <span className="text-3xl font-bold text-cyan-400">GAZESHIELD</span>
          </div>
          {/* Buttons */}
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-400">
              Already Registered?
              <button
                onClick={onLogin}
                className="ml-2 text-cyan-400 hover:underline"
              >
                Login
              </button>
            </span>
            <button
              onClick={onRegister}
              className="px-6 py-2 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition"
            >
              Register
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="min-h-screen flex flex-col md:flex-row items-center justify-between px-6 pt-32 gap-12 bg-gradient-to-b from-black via-zinc-900 to-zinc-950">
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          className="max-w-xl"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Your Screen <span className="text-cyan-400">Protected</span> Everywhere
          </h1>
          <p className="text-gray-300 text-lg mb-10">
            GazeShield is your personal anti-shoulder surfing assistant. 
            Real-time face recognition and gaze estimation ensure your work, exams, and confidential tasks stay private in any environment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onRegister}
              className="px-16 py-4 bg-cyan-500 text-black font-bold rounded-xl hover:scale-105 transition shadow-lg shadow-cyan-500/30"
            >
              Register Now
            </button>
            <button
              onClick={onLogin}
              className="px-16 py-4 border border-cyan-400 text-cyan-400 rounded-xl hover:bg-cyan-400/10 transition"
            >
              Login
            </button>
          </div>
        </motion.div>
        {/* Big Detailed Shield */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative flex justify-center items-center w-full md:w-1/2"
        >
          <div className="absolute w-96 h-96 rounded-full bg-cyan-500/20 animate-ping" />
          <svg
            className="w-96 h-96 drop-shadow-xl"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M32 2L2 12v18c0 19 14 32 30 32s30-13 30-32V12L32 2z"
              fill="url(#gradientShield)"
              stroke="#0ff"
              strokeWidth="2"
            />
            <path
              d="M32 20v12M26 28h12"
              stroke="#0ff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient
                id="gradientShield"
                x1="32"
                y1="2"
                x2="32"
                y2="64"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#0ff" stopOpacity="0.8"/>
                <stop offset="1" stopColor="#00bcd4" stopOpacity="0.2"/>
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </section>

      {/* THREAT SECTION */}
      <section className="py-36 px-6 bg-zinc-950 text-center space-y-8">
        <h3 className="text-4xl font-bold text-cyan-400">
          The Hidden Threat of Shoulder Surfing
        </h3>
        <p className="text-gray-300 text-lg leading-relaxed max-w-3xl mx-auto">
          Studies show that <span className="text-cyan-400 font-semibold">67%</span> of people 
          have experienced shoulder surfing. 
          <br/>
          <span className="text-red-400 font-semibold">45% of password leaks</span> occur due to nearby observers. 
          <br/>
          Confidential work, exams, and personal conversations can be compromised in seconds.
        </p>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-36 px-6 bg-gradient-to-r from-black via-zinc-900 to-black">
        <h3 className="text-4xl font-bold text-cyan-400 text-center mb-20">
          How GazeShield Protects You
        </h3>
        <div className="max-w-6xl mx-auto">
          {flowSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -60 : 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col md:flex-row ${
                index % 2 === 1 ? "md:flex-row-reverse" : ""
              } items-center gap-8 mb-16`}
            >
              <div className="flex-shrink-0">{step.icon}</div>
              <div className="max-w-md text-gray-300">
                <h4 className="text-2xl font-semibold mb-2">{step.title}</h4>
                <p className="leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ADAPTIVE SECURITY MODES */}
      <section className="py-36 px-6 bg-zinc-950">
        <h3 className="text-4xl font-bold text-cyan-400 text-center mb-16">
          Adaptive Security Modes
        </h3>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            {Object.keys(modes).map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                className={`w-full text-left px-6 py-4 rounded-xl border transition ${
                  activeMode === mode
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-white/10 bg-zinc-900"
                }`}
              >
                {mode} Mode
              </button>
            ))}
          </div>
          <motion.div
            key={activeMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-zinc-900/80 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center shadow-lg shadow-cyan-500/20"
          >
            {modeIcons[activeMode]}
            <p className="text-gray-300 text-lg mt-4">{modes[activeMode]}</p>
          </motion.div>
        </div>
      </section>

      {/* LIVE RESPONSE */}
      <section className="py-36 px-6 bg-gradient-to-r from-black via-zinc-900 to-black">
        <h3 className="text-4xl font-bold text-cyan-400 text-center mb-16">
          Real-Time Response & Evidence
        </h3>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
          <div className="text-gray-300">
            <h4 className="text-2xl font-semibold mb-4">
              If Someone Looks at Your Screen
            </h4>
            <p className="leading-relaxed">
              GazeShield reacts instantly: blurs your screen, triggers alerts, and logs snapshots, video clips, and timestamps securely.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <Evidence icon={<Camera />} label="Snapshot" />
            <Evidence icon={<Video />} label="Video Clip" />
            <Evidence icon={<AlertTriangle />} label="Timestamp Log" />
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-36 bg-gradient-to-r from-cyan-500 to-blue-500 text-black text-center px-6">
        <h3 className="text-4xl font-bold mb-6">
          Work Anywhere, Worry-Free
        </h3>
        <p className="max-w-2xl mx-auto mb-10">
          Cafés, classrooms, offices, or exams — GazeShield keeps your privacy intact with real-time monitoring and proactive protection.
        </p>
        <button
          onClick={onRegister}
          className="px-16 py-4 bg-black text-white rounded-xl font-bold hover:scale-105 transition"
        >
          Get Started
        </button>
      </section>
    </div>
  );
}

/* EVIDENCE COMPONENT */
const Evidence = ({ icon, label }) => (
  <motion.div
    whileHover={{ scale: 1.1 }}
    className="bg-zinc-900/80 border border-white/10 rounded-xl p-6 text-center flex flex-col items-center shadow-md shadow-red-500/10"
  >
    <div className="text-red-400 mb-3">{icon}</div>
    <p className="text-sm">{label}</p>
  </motion.div>
);

