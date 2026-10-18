import { useEffect, useRef } from "react";

export default function CameraCapture({ videoId }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    let stream;
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        console.error("Camera error", err);
      }
    }
    start();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className="camera-wrap">
      <video id={videoId} ref={videoRef} autoPlay playsInline />
      <div className="face-guide" aria-hidden="true" />
      <canvas ref={canvasRef} />
    </div>
  );
}

export function snapshotFromVideo(videoEl) {
  const canvas = document.createElement("canvas");
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  canvas.getContext("2d").drawImage(videoEl, 0, 0);
  return canvas.toDataURL("image/jpeg", 0.9);
}
