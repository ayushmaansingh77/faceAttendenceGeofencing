import base64
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import urllib.request

import cv2
import numpy as np

from config import (
    DETECTION_NMS_THRESHOLD,
    DETECTION_SCORE_THRESHOLD,
    DETECTION_TOP_K,
    MATCH_THRESHOLD,
    MODELS_DIR,
    RECOGNITION_MODEL_PATH,
    RECOGNITION_MODEL_URL,
    YUNET_MODEL_PATH,
    YUNET_MODEL_URL,
)


class FaceService:
    """
    Lightweight face analysis service using YuNet (OpenCV FaceDetectorYN) for
    detection and SFace (OpenCV Zoo, cv2.FaceRecognizerSF) for alignment,
    embedding extraction, and cosine similarity matching. Both models come
    from the same opencv_zoo project (Apache-2.0).
    """

    def __init__(
        self,
        yunet_model_path: Path = YUNET_MODEL_PATH,
        recognition_model_path: Path = RECOGNITION_MODEL_PATH,
        score_threshold: float = DETECTION_SCORE_THRESHOLD,
        nms_threshold: float = DETECTION_NMS_THRESHOLD,
        top_k: int = DETECTION_TOP_K,
    ):
        self.yunet_model_path = Path(yunet_model_path)
        self.recognition_model_path = Path(recognition_model_path)
        self.score_threshold = score_threshold
        self.nms_threshold = nms_threshold
        self.top_k = top_k

        self._detector: Optional[cv2.FaceDetectorYN] = None
        self._recognizer: Optional[cv2.FaceRecognizerSF] = None

    def _ensure_models(self) -> None:
        """Download or verify model files on disk."""
        MODELS_DIR.mkdir(parents=True, exist_ok=True)

        # 1. Ensure YuNet model
        if not self.yunet_model_path.exists() or self.yunet_model_path.stat().st_size < 10000:
            print(f"Downloading YuNet model to {self.yunet_model_path}...")
            req = urllib.request.Request(
                YUNET_MODEL_URL,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            with urllib.request.urlopen(req, timeout=30) as resp, open(self.yunet_model_path, "wb") as f:
                content = resp.read()
                # Check if Git LFS pointer was returned instead of binary
                if len(content) < 1000 and b"git-lfs" in content:
                    lfs_url = "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
                    print(f"Resolving Git LFS stream from {lfs_url}...")
                    req_lfs = urllib.request.Request(lfs_url, headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(req_lfs, timeout=30) as lfs_resp:
                        content = lfs_resp.read()
                f.write(content)
            print(f"YuNet model downloaded ({self.yunet_model_path.stat().st_size} bytes).")

        # 2. Ensure SFace recognition model
        if not self.recognition_model_path.exists() or self.recognition_model_path.stat().st_size < 100000:
            print(f"Downloading SFace recognition model to {self.recognition_model_path}...")
            req = urllib.request.Request(
                RECOGNITION_MODEL_URL,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            with urllib.request.urlopen(req, timeout=60) as resp, open(self.recognition_model_path, "wb") as f:
                content = resp.read()
                # Same Git LFS pointer guard as the YuNet download above.
                if len(content) < 1000 and b"git-lfs" in content:
                    lfs_url = (
                        "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/"
                        "models/face_recognition_sface/face_recognition_sface_2021dec.onnx"
                    )
                    print(f"Resolving Git LFS stream from {lfs_url}...")
                    req_lfs = urllib.request.Request(lfs_url, headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(req_lfs, timeout=60) as lfs_resp:
                        content = lfs_resp.read()
                f.write(content)
            print(f"SFace model ready at {self.recognition_model_path} ({self.recognition_model_path.stat().st_size} bytes).")

    def initialize_model(self) -> None:
        """Load and prepare the YuNet detector and the SFace recognizer."""
        if self._detector is None or self._recognizer is None:
            self._ensure_models()

            print(f"Loading YuNet Face Detector ({self.yunet_model_path.name})...")
            self._detector = cv2.FaceDetectorYN.create(
                model=str(self.yunet_model_path),
                config="",
                input_size=(640, 640),
                score_threshold=self.score_threshold,
                nms_threshold=self.nms_threshold,
                top_k=self.top_k,
            )

            print(f"Loading SFace Recognizer ({self.recognition_model_path.name})...")
            self._recognizer = cv2.FaceRecognizerSF.create(
                model=str(self.recognition_model_path),
                config="",
            )
            print("YuNet & SFace models loaded successfully.")

    @property
    def detector(self) -> cv2.FaceDetectorYN:
        """Return initialized FaceDetectorYN instance, loading lazily if needed."""
        if self._detector is None:
            self.initialize_model()
        return self._detector

    @property
    def recognizer(self) -> cv2.FaceRecognizerSF:
        """Return initialized FaceRecognizerSF instance, loading lazily if needed."""
        if self._recognizer is None:
            self.initialize_model()
        return self._recognizer

    @staticmethod
    def decode_image(data_url: str) -> np.ndarray:
        """Decode a base64 data URL string into an OpenCV BGR image."""
        if "," in data_url:
            _, encoded = data_url.split(",", 1)
        else:
            encoded = data_url

        img_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Failed to decode image from base64 data.")
        return img

    def get_embedding(self, img: np.ndarray) -> Tuple[Optional[np.ndarray], Optional[str]]:
        """
        Run YuNet face detection, then SFace alignment + embedding extraction.
        FaceRecognizerSF.alignCrop() takes YuNet's raw detection row directly
        (bbox + 5 landmarks) — no manual landmark extraction or affine-warp
        code needed, unlike the previous ArcFace pipeline.
        """
        if self._detector is None or self._recognizer is None:
            self.initialize_model()

        height, width = img.shape[:2]
        self.detector.setInputSize((width, height))

        _, faces = self.detector.detect(img)
        if faces is None or len(faces) == 0:
            return None, "No face detected. Make sure your face is clearly visible and well lit."
        if len(faces) > 1:
            return None, f"Multiple faces detected ({len(faces)}). Please make sure only one person is in frame."

        face = faces[0]

        aligned_face = self.recognizer.alignCrop(img, face)
        embedding = self.recognizer.feature(aligned_face).flatten()

        return embedding, None

    @staticmethod
    def cosine_similarity(a: Any, b: Any) -> float:
        """
        Compute cosine similarity between two embedding vectors. Returns 0.0
        (never a match) for mismatched dimensions instead of raising — this
        happens when an embedding was enrolled under a since-replaced
        recognition model (e.g. old 512-D ArcFace vs current 128-D SFace
        vectors); callers that need to tell the user to re-enroll rather
        than just silently score 0.0 should check lengths themselves first
        (see routers/attendance.py::_verify_face).
        """
        vec_a = np.asarray(a, dtype=np.float32)
        vec_b = np.asarray(b, dtype=np.float32)
        if vec_a.shape != vec_b.shape:
            return 0.0
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))

    def find_best_match(
        self,
        target_embedding: np.ndarray,
        candidates: List[Dict[str, Any]],
        threshold: float = MATCH_THRESHOLD,
    ) -> Dict[str, Any]:
        """
        Find the candidate with highest cosine similarity to target embedding.
        """
        if not candidates:
            return {
                "match": False,
                "person": None,
                "similarity": None,
                "threshold": threshold,
                "message": "No one is registered yet.",
            }

        best_score = -1.0
        best_person = None

        for person in candidates:
            score = self.cosine_similarity(target_embedding, person["embedding"])
            if score > best_score:
                best_score = score
                best_person = person

        is_match = best_score >= threshold
        return {
            "match": is_match,
            "person": best_person if is_match else None,
            "similarity": round(best_score, 4),
            "threshold": threshold,
            "best_person_candidate": best_person,
        }


# Shared default singleton instance
face_service = FaceService()
