import { useState } from "react";
import CameraCapture, { snapshotFromVideo } from "../components/CameraCapture.jsx";
import { checkIn } from "../api.js";
import { getCurrentPosition } from "../geo.js";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";

export default function CheckIn() {
  const { user } = useAuth();
  const [result, setResult] = useState(null);

  async function onSubmit() {
    setResult({ pending: true });
    let position;
    try {
      position = await getCurrentPosition();
    } catch (err) {
      setResult({ ok: false, error: `Location error: ${err.message}` });
      return;
    }
    const video = document.querySelector("#checkInVideo");
    const image = snapshotFromVideo(video);
    const data = await checkIn(image, position.lat, position.lng);
    setResult(data);
  }

  return (
    <>
      <h1>Check In</h1>
      <p className="sub">Verifies your face and your current location against active geofence zones.</p>
      <Card style={{ maxWidth: 480 }}>
        <div className="identity-row">
          <span>Name: <strong>{user?.name}</strong></span>
          <span>ID: <strong>{user?.id}</strong></span>
        </div>
        <CameraCapture videoId="checkInVideo" />
        <Button onClick={onSubmit} loading={result?.pending} style={{ marginTop: 12 }}>
          Check In
        </Button>
        {result && !result.pending && (
          <div className={`result ${result.ok ? "ok" : "bad"}`}>
            {result.ok
              ? `${result.message}\nSimilarity: ${result.similarity}`
              : result.error}
          </div>
        )}
      </Card>
    </>
  );
}
