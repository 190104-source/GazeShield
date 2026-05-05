import * as faceapi from "face-api.js";
import { api } from "../api/api";

// ⚙️ Utility function to test recognition accuracy
export async function testAccuracy(threshold = 0.6) {
  console.log("🔍 Loading models...");
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models/"),
    faceapi.nets.faceLandmark68Net.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models/"),
    faceapi.nets.faceRecognitionNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models/"),
  ]);

  console.log("📸 Fetching test faces...");
  const res = await api.get("/faces");
  const faces = res.data;

  // Split your dataset: half for training, half for testing
  const half = Math.floor(faces.length / 2);
  const trainData = faces.slice(0, half);
  const testData = faces.slice(half);

  const labeledDescriptors = trainData.map(
    f => new faceapi.LabeledFaceDescriptors(
      f.name,
      f.descriptors.map(d => new Float32Array(d))
    )
  );

  const matcher = new faceapi.FaceMatcher(labeledDescriptors, threshold);

  let TP = 0, FP = 0, TN = 0, FN = 0;

  console.log("🧠 Testing...");
  for (const item of testData) {
    for (const desc of item.descriptors) {
      const bestMatch = matcher.findBestMatch(new Float32Array(desc));
      const predicted = bestMatch.label;
      const actual = item.name;

      if (predicted === actual) TP++;
      else if (predicted !== "unknown" && actual !== predicted) FP++;
      else if (predicted === "unknown" && actual === "unknown") TN++;
      else if (predicted === "unknown" && actual !== "unknown") FN++;
    }
  }

  const accuracy = ((TP + TN) / (TP + TN + FP + FN)) * 100;
  console.log(`✅ Accuracy: ${accuracy.toFixed(2)}%`);
  console.log({ TP, FP, TN, FN });
}