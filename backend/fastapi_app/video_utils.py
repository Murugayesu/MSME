"""
video_utils.py
Utilities for drone video processing and GPS SRT file parsing.
"""
import re
import base64
import os
import tempfile
from typing import List, Optional, Tuple, Dict

# OpenCV is optional - gracefully handle if not installed
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("Warning: opencv-python not installed. Video processing will be unavailable.")


def extract_frames(video_path: str, interval_sec: float = 5.0, max_frames: int = 20) -> List[Tuple[float, str]]:
    """
    Extract frames from a video at a given time interval.

    Args:
        video_path:    Absolute path to the video file.
        interval_sec:  Extract one frame every N seconds.
        max_frames:    Maximum number of frames to extract (safety cap).

    Returns:
        List of (timestamp_seconds, base64_encoded_jpeg) tuples.
    """
    if not CV2_AVAILABLE:
        raise RuntimeError("opencv-python is required for video processing. Run: pip install opencv-python")

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError(f"Cannot open video file: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    interval_frames = max(1, int(fps * interval_sec))
    frames: List[Tuple[float, str]] = []
    frame_idx = 0

    while len(frames) < max_frames:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_idx % interval_frames == 0:
            timestamp = frame_idx / fps
            _, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            b64 = base64.b64encode(buffer).decode("utf-8")
            frames.append((round(timestamp, 2), f"data:image/jpeg;base64,{b64}"))
        frame_idx += 1

    cap.release()
    return frames


# --- SRT GPS Parsing ---

# DJI drone SRT block example:
# 1
# 00:00:00,000 --> 00:00:00,033
# <font size="36">SrtCnt : 1, DiffTime : 33ms
# 2023-01-01 10:00:00
# [latitude: 12.9716] [longitude: 77.5946] [altitude: 120.00] </font>

_GPS_PATTERN = re.compile(
    r"\[latitude\s*:\s*(-?\d+\.\d+)\].*?\[longitude\s*:\s*(-?\d+\.\d+)\].*?\[altitude\s*:\s*(-?\d+\.?\d*)\]",
    re.DOTALL | re.IGNORECASE,
)

_TIMESTAMP_PATTERN = re.compile(
    r"(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->"
)


def _ts_to_seconds(h: str, m: str, s: str, ms: str) -> float:
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000.0


def parse_srt(srt_path: str) -> List[Dict]:
    """
    Parse a DJI-format .srt file and extract GPS telemetry per subtitle block.

    Args:
        srt_path: Absolute path to the .srt file.

    Returns:
        List of dicts: [{timestamp_sec, latitude, longitude, altitude}, ...]
    """
    with open(srt_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()

    # Split into subtitle blocks (separated by double newlines after a number)
    blocks = re.split(r"\n\s*\n", content.strip())
    telemetry: List[Dict] = []

    for block in blocks:
        lines = block.strip().splitlines()
        if len(lines) < 2:
            continue

        # Find timestamp line
        ts_match = None
        ts_sec = 0.0
        for line in lines:
            ts_match = _TIMESTAMP_PATTERN.search(line)
            if ts_match:
                ts_sec = _ts_to_seconds(*ts_match.groups())
                break

        # Find GPS data in subsequent lines
        gps_match = _GPS_PATTERN.search(block)
        if gps_match:
            lat, lon, alt = gps_match.groups()
            telemetry.append({
                "timestamp_sec": ts_sec,
                "latitude": float(lat),
                "longitude": float(lon),
                "altitude": float(alt),
            })

    return telemetry


def match_frames_to_gps(
    frames: List[Tuple[float, str]],
    telemetry: List[Dict]
) -> List[Dict]:
    """
    Match each extracted frame to the closest GPS telemetry entry by timestamp.

    Args:
        frames:    List of (timestamp_sec, base64_image) from extract_frames().
        telemetry: List of GPS dicts from parse_srt().

    Returns:
        List of dicts with image + GPS info merged.
    """
    if not telemetry:
        return [
            {"timestamp_sec": ts, "image": img, "latitude": None, "longitude": None, "altitude": None}
            for ts, img in frames
        ]

    results = []
    for ts, img in frames:
        closest = min(telemetry, key=lambda t: abs(t["timestamp_sec"] - ts))
        results.append({
            "timestamp_sec": ts,
            "image": img,
            "latitude": closest["latitude"],
            "longitude": closest["longitude"],
            "altitude": closest["altitude"],
        })
    return results
