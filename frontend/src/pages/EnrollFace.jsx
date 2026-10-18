import { useState } from "react";
import CameraCapture, { snapshotFromVideo } from "../components/CameraCapture.jsx";
import { enrollFace } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";

export default function EnrollFace() {
  const { user } = useAuth();
  const [result, setResult] = useState(null);

  async function onCapture() {
    const video = document.querySelector("#enrollVideo");
    const image = snapshotFromVideo(video);
    setResult({ pending: true });
    const data = await enrollFace(image);
    setResult(data);
  }

  return (
    <>
      <h1>Enroll Face</h1>
      <p className="sub">Capture your face once so you can check in/out with it. Re-capturing replaces your previous enrollment.</p>
      <Card style={{ maxWidth: 480 }}>
        <div className="identity-row">
          <span>Name: <strong>{user?.name}</strong></span>
          <span>ID: <strong>{user?.id}</strong></span>
        </div>
        <CameraCapture videoId="enrollVideo" />
        <Button onClick={onCapture} loading={result?.pending} style={{ marginTop: 12 }}>
          Capture & Enroll
        </Button>
        {result && !result.pending && (
          <div className={`result ${result.ok ? "ok" : "bad"}`}>
            {result.ok ? result.message : result.error}
          </div>
        )}
      </Card>
    </>
  );
}
