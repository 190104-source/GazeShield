/* =================== DASHBOARD UPDATED (Analytics Separated) =================== */
import { useEffect, useState, useRef } from "react";
import { api } from "../api/api";
import dashboardImg from "../assets/dashboard.png";
import TeamsSection from "./dashboard/TeamsSection";
import MembersSection from "./dashboard/MembersSection";
import * as faceapi from "face-api.js";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard({ userId: propUserId, onLogout }) {
  const userId = propUserId || localStorage.getItem("user_id");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeMode, setActiveMode] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");

  const [evidenceList, setEvidenceList] = useState([]);
  const [accuracyData, setAccuracyData] = useState([]); // moved to global for analytics
  const addEvidence = (item) => setEvidenceList((prev) => [item, ...prev]);

  useEffect(() => {
    if (!userId) return;
    const fetchUser = async () => {
      try {
        const res = await api.get(`/users/users/${userId}`);
        setUser(res.data);
      } catch (err) {
        console.error("Failed to load user", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (!userId) return <CenterText text="Please login again" />;
  if (loading) return <CenterText text="Loading dashboard..." />;
  if (!user) return <CenterText text="User not found" />;

  const canStart =
    activeMode &&
    (activeMode === "single" ||
      activeMode === "exam" ||
      (activeMode === "team" && selectedTeam) ||
      (activeMode === "member" && selectedUsers.length > 0));

  const bgMain = darkMode
    ? "bg-gray-900 text-gray-100"
    : "bg-[#f5f7fb] text-gray-900";

  const sidebarBg = darkMode
    ? "bg-gradient-to-b from-gray-800 to-gray-900"
    : "bg-gradient-to-b from-blue-700 to-blue-900 text-white";

  return (
    <div className={`flex min-h-screen ${bgMain}`}>
      {/* SIDEBAR */}
      <aside className={`w-64 ${sidebarBg} flex flex-col justify-between`}>
        <div>
          <div className="px-6 py-5 text-xl font-bold">🛡️ GazeShield</div>
          <nav className="mt-6 space-y-2 px-4 text-sm">
            <SidebarItem
              label="Overview"
              active={activeSection === "overview"}
              onClick={() => setActiveSection("overview")}
            />
            <SidebarItem
              label="Teams"
              active={activeSection === "teams"}
              onClick={() => setActiveSection("teams")}
            />
            <SidebarItem
              label="Members"
              active={activeSection === "members"}
              onClick={() => setActiveSection("members")}
            />
            <SidebarItem
              label="Logs & Evidence"
              active={activeSection === "logs"}
              onClick={() => setActiveSection("logs")}
            />
            <SidebarItem
              label="Analytics"
              active={activeSection === "analytics"}
              onClick={() => setActiveSection("analytics")}
            />
            <SidebarItem
              label="Settings"
              active={activeSection === "settings"}
              onClick={() => setActiveSection("settings")}
            />
          </nav>
        </div>

        <div className="p-4 border-t border-gray-700">
          <p className="text-sm">{user.name}</p>
          <p className="text-xs text-gray-400">{user.role}</p>
          <button
            onClick={onLogout}
            className="mt-3 text-sm text-red-400 hover:text-red-500"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-8 space-y-6">
        {activeSection === "overview" && (
          <OverviewSection
            user={user}
            activeMode={activeMode}
            setActiveMode={setActiveMode}
            selectedTeam={selectedTeam}
            selectedUsers={selectedUsers}
            canStart={canStart}
            darkMode={darkMode}
            addEvidence={addEvidence}
            setAccuracyData={setAccuracyData}
          />
        )}

        {activeSection === "analytics" && (
          <AnalyticsSection accuracyData={accuracyData} />
        )}

        {activeSection === "teams" && (
          <TeamsSection
            selectedTeam={selectedTeam}
            setSelectedTeam={setSelectedTeam}
          />
        )}

        {activeSection === "members" && (
          <MembersSection
            selectedUsers={selectedUsers}
            setSelectedUsers={setSelectedUsers}
          />
        )}

        {activeSection === "logs" && (
          <LogsSection
            evidenceList={evidenceList}
            setEvidenceList={setEvidenceList}
          />
        )}

        {["settings"].includes(activeSection) && (
          <Placeholder title={activeSection} />
        )}
      </main>
    </div>
  );
}

/* ================= OVERVIEWSECTION (Monitoring Only) ================= */
function OverviewSection({
  user,
  activeMode,
  setActiveMode,
  selectedTeam,
  selectedUsers,
  canStart,
  darkMode,
  addEvidence,
  setAccuracyData,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState(null);
  const [detectedNames, setDetectedNames] = useState(["Scanning..."]);
  const [isBlurred, setIsBlurred] = useState(false);
  const alertAudio = useRef(new Audio("/alert-beep.mp3")).current;

  useEffect(() => {
    const loadModels = async () => {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(
          "https://justadudewhohacks.github.io/face-api.js/models/"
        ),
        faceapi.nets.faceLandmark68Net.loadFromUri(
          "https://justadudewhohacks.github.io/face-api.js/models/"
        ),
        faceapi.nets.faceRecognitionNet.loadFromUri(
          "https://justadudewhohacks.github.io/face-api.js/models/"
        ),
      ]);
    };
    loadModels();
  }, []);

  useEffect(() => {
    const fetchFaceDescriptors = async () => {
      let ids = [];
      if (activeMode === "team" && selectedTeam)
        ids = selectedTeam.members.map((m) => m.id);
      else if (activeMode === "member" && selectedUsers.length)
        ids = selectedUsers.map((u) => u.id);
      else ids = [user.id];

      try {
        const res = await api.get("/faces", { params: { ids: ids.join(",") } });
        const labeledDescriptors = res.data.map(
          (f) =>
            new faceapi.LabeledFaceDescriptors(
              f.name,
              f.descriptors.map((d) => new Float32Array(d))
            )
        );
        setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.6));
      } catch (err) {
        console.error("Failed to fetch face descriptors:", err);
      }
    };
    if (activeMode) fetchFaceDescriptors();
  }, [activeMode, selectedTeam, selectedUsers, user]);

  const handleStartMonitoring = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;
    videoRef.current.srcObject = stream;

    videoRef.current.onloadedmetadata = () => {
      videoRef.current.play();
      setIsCameraOn(true);

      const canvas = faceapi.createCanvasFromMedia(videoRef.current);
      canvasRef.current = canvas;
      document.body.append(canvas);

      const displaySize = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };
      faceapi.matchDimensions(canvas, displaySize);

      intervalRef.current = setInterval(async () => {
        if (!videoRef.current || !faceMatcher) return;

        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let unknownDetected = false;
        const namesThisFrame = [];

        for (const detection of resizedDetections) {
          const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
          let name = "Unknown";
          let isRegistered = false;

          if (bestMatch.label !== "unknown" && bestMatch.distance <= 0.55) {
            name = bestMatch.label;
            isRegistered = name === user.name;

            const confidence = (1 - bestMatch.distance) * 100;
            setAccuracyData((prev) => [
              ...prev.slice(-20),
              {
                time: new Date().toLocaleTimeString(),
                value: Math.min(Math.max(confidence, 0), 100),
              },
            ]);
          } else {
            name = "Unknown";
            unknownDetected = true;
          }

          const leftEye = detection.landmarks.getLeftEye();
          const rightEye = detection.landmarks.getRightEye();
          const gazeAway = isLookingAway(leftEye, rightEye);
          if (!isRegistered && !gazeAway) unknownDetected = true;

          namesThisFrame.push(name);
          new faceapi.draw.DrawBox(detection.detection.box, { label: name }).draw(canvas);
        }

        setDetectedNames(namesThisFrame.length ? namesThisFrame : ["Scanning..."]);

        if (unknownDetected) {
          setIsBlurred(true);
          alertAudio.currentTime = 0;
          alertAudio.play();

          const snapCanvas = document.createElement("canvas");
          snapCanvas.width = videoRef.current.videoWidth;
          snapCanvas.height = videoRef.current.videoHeight;
          snapCanvas.getContext("2d").drawImage(videoRef.current, 0, 0);
          const dataUrl = snapCanvas.toDataURL("image/png");
          addEvidence({ timestamp: new Date().toLocaleString(), image: dataUrl });
        } else {
          setIsBlurred(false);
        }
      }, 700);
    };
  };

  const handleStopMonitoring = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (canvasRef.current) {
      canvasRef.current.remove();
      canvasRef.current = null;
    }
    setIsCameraOn(false);
    setIsBlurred(false);
    setDetectedNames(["Scanning..."]);
    setAccuracyData([]); // reset analytics
  };

  const isLookingAway = (leftEye, rightEye) => {
    const avgX = (leftEye[0].x + leftEye[3].x + rightEye[0].x + rightEye[3].x) / 4;
    const centerX = videoRef.current.videoWidth / 2;
    return Math.abs(avgX - centerX) > videoRef.current.videoWidth * 0.15;
  };

  return (
    <div className="relative">
      <h1 className="text-2xl font-bold">Welcome, {user.name} 👋</h1>

      {isBlurred && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <p className="text-red-500 text-xl font-bold text-center px-4">
            ⚠️ Unauthorized user detected! Screen is blurred until they leave.
          </p>
        </div>
      )}

      <section className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Detected User(s):</h2>
        {detectedNames.map((name, idx) => (
          <p
            key={idx}
            className={`font-medium ${
              name === "Unknown" ? "text-red-500" : "text-green-400"
            }`}
          >
            {name}
          </p>
        ))}

        <h2 className="text-lg font-semibold mt-6 mb-2">
          Select Monitoring Mode
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ModeCard
            title="single"
            label="Single"
            desc="Only you are allowed"
            {...{ activeMode, setActiveMode, darkMode }}
          />
          <ModeCard
            title="team"
            label="Team"
            desc="Selected team members allowed"
            {...{ activeMode, setActiveMode, darkMode }}
          />
          <ModeCard
            title="member"
            label="Members"
            desc="Selected registered users allowed"
            {...{ activeMode, setActiveMode, darkMode }}
          />
          <ModeCard
            title="exam"
            label="Exam"
            desc="Strict monitoring mode"
            {...{ activeMode, setActiveMode, darkMode }}
          />
        </div>
      </section>

      <section
        className={`mt-8 p-6 rounded-lg ${
          darkMode ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <div className="flex flex-col md:flex-row items-center gap-8">
          <img src={dashboardImg} alt="preview" className="w-[360px] rounded" />
          <div className="flex flex-col justify-center">
            <h3 className="text-xl font-semibold mb-3">Monitoring Control</h3>
            <div className="flex gap-4">
              <button
                disabled={!canStart || isCameraOn}
                onClick={handleStartMonitoring}
                className={`px-6 py-2 rounded text-white ${
                  canStart && !isCameraOn
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
              >
                Start Monitoring
              </button>
              <button
                disabled={!isCameraOn}
                onClick={handleStopMonitoring}
                className={`px-6 py-2 rounded text-white ${
                  isCameraOn
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gray-500 cursor-not-allowed"
                }`}
              >
                Stop Monitoring
              </button>
            </div>
            <p className="mt-3 text-sm">
              {isCameraOn ? (
                <span className="text-green-400">
                  🟢 Camera ON – capturing faces & gaze
                </span>
              ) : (
                <span className="text-gray-400">⚫ Camera OFF</span>
              )}
            </p>
          </div>
        </div>
      </section>

      <video
        ref={videoRef}
        autoPlay
        muted
        className="fixed bottom-4 right-4 w-44 h-32 rounded-lg border border-gray-400 shadow bg-black"
      />
    </div>
  );
}

/* ================= ANALYTICS SECTION (Confidence Graph) ================= */
function AnalyticsSection({ accuracyData }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Analytics Dashboard</h2>
      <div className="p-4 rounded-lg bg-gray-800">
        <h2 className="text-lg font-semibold mb-2 text-white">
          Recognition Confidence (%)
        </h2>
        {accuracyData.length === 0 ? (
          <p className="text-gray-400 text-sm">No recognition data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#555" />
              <XAxis dataKey="time" tick={{ fill: "#aaa" }} />
              <YAxis domain={[0, 100]} tick={{ fill: "#aaa" }} />
              <Tooltip contentStyle={{ background: "#222", border: "none" }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4ade80"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

/* ================= LOGS SECTION ================= */
function LogsSection({ evidenceList, setEvidenceList }) {
  const handleDelete = (idx) => {
    setEvidenceList((prev) => prev.filter((_, i) => i !== idx));
  };
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Logs & Evidence</h2>
      {evidenceList.length === 0 && <p>No evidence yet.</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {evidenceList.map((item, idx) => (
          <div key={idx} className="border rounded p-2 relative">
            <p className="text-xs text-gray-500">{item.timestamp}</p>
            <img src={item.image} alt="evidence" className="w-full rounded mt-1" />
            <button
              onClick={() => handleDelete(idx)}
              className="absolute top-1 right-1 text-red-500 hover:text-red-700 text-xs"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */
function ModeCard({ title, label, desc, activeMode, setActiveMode, darkMode }) {
  const isActive = activeMode === title;
  return (
    <div
      onClick={() => setActiveMode(title)}
      className={`p-4 rounded-lg cursor-pointer border transition ${
        isActive
          ? "bg-blue-600 text-white"
          : darkMode
          ? "bg-gray-700 hover:bg-gray-600"
          : "bg-white hover:bg-gray-100"
      }`}
    >
      <h3 className="font-semibold mb-1">{label}</h3>
      <p className="text-xs">{desc}</p>
    </div>
  );
}

function SidebarItem({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-2 rounded cursor-pointer transition ${
        active ? "bg-blue-600 text-white" : "hover:bg-gray-700 hover:text-white"
      }`}
    >
      {label}
    </div>
  );
}

function Placeholder({ title }) {
  return (
    <div>
      <h2 className="text-2xl font-bold capitalize">{title}</h2>
      <p className="text-sm text-gray-400">Section under development.</p>
    </div>
  );
}

function CenterText({ text }) {
  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      {text}
    </div>
  );
}