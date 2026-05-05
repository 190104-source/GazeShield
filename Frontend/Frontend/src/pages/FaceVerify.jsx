import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/api";

export default function FaceVerify() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 🎥 Start Camera automatically
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
    } catch (err) {
      setError("Camera access denied.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  // Capture a single frame
  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Camera not ready. Try again.");
      return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL("image/jpeg"); // ✅ base64 JPEG
  };

  // Verify face
  const verifyFace = async () => {
    setLoading(true);
    setError("");

    const image = captureFrame();
    if (!image) {
      setLoading(false);
      return;
    }

    try {
      // ✅ Use token for authentication
      const token = localStorage.getItem("access_token");
      const res = await api.post(
        "/face/verify",
        { image },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.verified) {
        localStorage.setItem("faceVerified", "true");
        stopCamera();
        navigate("/dashboard");
      } else {
        setError(res.data.message || "Face not recognized.");
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.detail || "Verification failed.");
    }

    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Face Verification Required</h2>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        width="400"
        style={{ borderRadius: "10px", marginTop: "20px" }}
      />

      <div style={{ marginTop: "20px" }}>
        <button onClick={verifyFace} disabled={loading}>
          {loading ? "Verifying..." : "Verify Face"}
        </button>
      </div>

      {error && <p style={{ color: "red", marginTop: "15px" }}>{error}</p>}
    </div>
  );
}