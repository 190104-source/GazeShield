import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { api } from "../api/api";

export default function RegisterFace({ goHome, onRegistered }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bbox, setBbox] = useState(null);
  const [feedbackColor, setFeedbackColor] = useState("red");
  const [autoCapturing, setAutoCapturing] = useState(false);

  const userId = localStorage.getItem("user_id");

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-400">
        Error: userId missing. Please login again.
      </div>
    );
  }

  // 🔹 Capture and send to backend
  const captureFrame = async () => {
    if (!webcamRef.current || count >= 50) return;

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      const res = await api.post("/vision/register-face-frame", {
        image: imageSrc,
        user_id: userId,
      });

      const data = res.data;

      setBbox(data.bbox || null);
      setFeedbackColor(data.accepted ? "lime" : "red");

      if (data.accepted) {
        setCount((prev) => prev + 1);
      } else {
        setError(data.reason);
      }
    } catch (err) {
      console.error(err);
      setError("Server error while capturing face.");
    }
  };

  // 🔹 Auto Capture (every 300ms)
  useEffect(() => {
    if (!autoCapturing) return;

    const interval = setInterval(() => {
      captureFrame();
    }, 300);

    return () => clearInterval(interval);
  }, [autoCapturing]);

  // 🔹 Stop auto when 50 reached
  useEffect(() => {
    if (count >= 50) {
      setAutoCapturing(false);
      alert("Face registration completed successfully!");
      if (onRegistered) onRegistered();
    }
  }, [count, onRegistered]);

  // 🔹 Draw bounding box
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    const video = webcamRef.current?.video;
    if (!ctx || !video) return;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (bbox) {
      ctx.strokeStyle = feedbackColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        bbox.x * ctx.canvas.width,
        bbox.y * ctx.canvas.height,
        bbox.width * ctx.canvas.width,
        bbox.height * ctx.canvas.height
      );
    }
  });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#050b17] via-[#0b1c2f] to-black flex items-center justify-center px-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-[#0a1930]/90 shadow-[0_0_40px_rgba(79,245,255,0.15)] p-6">

        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">📸</div>
          <h1 className="text-2xl font-bold tracking-wider text-cyan-300">
            Face Registration
          </h1>
          <p className="text-xs tracking-widest text-cyan-200/70 mt-1">
            CAPTURE CLEAR FACE FRAMES
          </p>
        </div>

        {/* Webcam + Canvas */}
        <div className="relative rounded-xl overflow-hidden border border-cyan-400/30 mb-4">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
          />
        </div>

        {/* Status */}
        <p className="text-center text-cyan-200 mb-2">
          Captured: <span className="font-bold">{count}</span> / 50
        </p>

        {error && (
          <p className="text-center text-red-400 text-sm mb-2">
            {error}
          </p>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">

          {/* Auto Capture */}
          <button
            onClick={() => setAutoCapturing(true)}
            disabled={autoCapturing || count >= 50}
            className="w-full py-3 rounded-xl font-bold bg-yellow-500 text-black hover:bg-yellow-400 transition disabled:opacity-60"
          >
            {autoCapturing ? "AUTO CAPTURING..." : "AUTO CAPTURE (50 FRAMES)"}
          </button>

          {/* Manual Capture */}
          <button
            onClick={captureFrame}
            disabled={loading || count >= 50}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 text-black shadow-[0_0_25px_rgba(79,245,255,0.4)] hover:scale-[1.02] transition disabled:opacity-60"
          >
            {loading ? "CAPTURING..." : "CAPTURE FRAME"}
          </button>

        </div>

        {/* Back */}
        <div className="mt-4 text-center">
          <button
            onClick={goHome}
            className="text-cyan-300 text-sm tracking-widest hover:text-cyan-400 transition"
          >
            ← BACK TO HOME
          </button>
        </div>
      </div>
    </div>
  );
}