# This import provides deque for fixed-size temporal buffering.
from collections import deque
# This import provides dataclass for compact frame metric records.
from dataclasses import dataclass
# This import provides typing annotations for clearer interfaces.
from typing import Deque, Dict, List, Optional, Tuple

# This import provides OpenCV primitives for PnP solving and video frames.
import cv2
# This import provides MediaPipe face mesh landmarks.
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.core.base_options import BaseOptions
from mediapipe import Image, ImageFormat
# This import provides fast vectorized numerical math.
import numpy as np


# This dataclass stores per-frame head pose measurements.
@dataclass
class FramePose:
    # This field stores frame index in the source video.
    frame_index: int
    # This field stores timestamp in seconds.
    timestamp: float
    # This field stores head pitch angle in degrees.
    pitch: float
    # This field stores head yaw angle in degrees.
    yaw: float
    # This field stores head roll angle in degrees.
    roll: float
    # This field stores lightweight landmark points for frontend drawing.
    mesh_points: List[Tuple[float, float]]


# This class encapsulates MediaPipe + PnP + temporal movement logic.
class HeadMotionAnalyzer:
    # This constructor initializes thresholds and reusable components.
    def __init__(self, window_size: int = 24, pitch_threshold: float = 9.0, yaw_threshold: float = 10.0, roll_threshold: float = 8.0) -> None:
        # This member stores the temporal window size in frames.
        self.window_size = window_size
        # This member stores pitch oscillation threshold in degrees.
        self.pitch_threshold = pitch_threshold
        # This member stores yaw oscillation threshold in degrees.
        self.yaw_threshold = yaw_threshold
        # This member stores roll oscillation threshold in degrees.
        self.roll_threshold = roll_threshold
        # This member stores the current frame timestamp in milliseconds.
        self._frame_timestamp_ms = 0
        # This member stores the MediaPipe face landmarker options.
        self._base_options = BaseOptions(model_asset_path="face_landmarker.task")
        # This member stores the configured landmarker options.
        self._landmarker_options = vision.FaceLandmarkerOptions(
            base_options=self._base_options,
            num_faces=1,
            output_face_blendshapes=False,
            output_facial_transformation_matrixes=False,
            running_mode=vision.RunningMode.VIDEO
        )

    # This method computes lightweight 2D image landmarks from a frame.
    def _extract_landmarks(self, frame_bgr: np.ndarray, face_landmarker: vision.FaceLandmarker) -> Optional[Tuple[np.ndarray, List[Tuple[float, float]]]]:
        # This line converts frame color from BGR to RGB for MediaPipe.
        frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        # This line creates MediaPipe Image from RGB frame.
        mp_image = Image(image_format=ImageFormat.SRGB, data=frame_rgb)
        # This line runs MediaPipe inference to get face landmarks.
        results = face_landmarker.detect_for_video(mp_image, self._frame_timestamp_ms)
        # This guard returns None when no face is detected.
        if not results.face_landmarks:
            # This return indicates missing landmarks for current frame.
            return None
        # This line selects the first detected face landmarks.
        landmarks = results.face_landmarks[0]
        # This line stores frame height and width for pixel conversion.
        h, w, _ = frame_bgr.shape
        # This line defines robust landmark indices for PnP solving.
        selected_indices = [1, 33, 61, 199, 263, 291]
        # This list will collect pixel-space 2D points for PnP.
        image_points = []
        # This list will collect normalized points for neon overlay drawing.
        mesh_points = []
        # This loop iterates over selected landmark indices.
        for idx in selected_indices:
            # This line reads the selected normalized landmark.
            point = landmarks[idx]
            # This line appends normalized point for frontend canvas rendering.
            mesh_points.append((float(point.x), float(point.y)))
            # This line appends pixel-space point for PnP input.
            image_points.append((float(point.x * w), float(point.y * h)))
        # This return sends both numeric arrays and normalized points.
        return np.array(image_points, dtype=np.float64), mesh_points

    # This method solves Euler angles from sparse face landmarks.
    def _solve_euler(self, image_points: np.ndarray, frame_shape: Tuple[int, int, int]) -> Tuple[float, float, float]:
        # This line stores frame height and width for intrinsic matrix creation.
        h, w, _ = frame_shape
        # This array defines a canonical 3D face model in millimeter-like units.
        model_points = np.array([
            (0.0, 0.0, 0.0),
            (-30.0, -125.0, -30.0),
            (-60.0, -70.0, -60.0),
            (0.0, 75.0, -20.0),
            (30.0, -125.0, -30.0),
            (60.0, -70.0, -60.0),
        ], dtype=np.float64)
        # This line estimates focal length from frame width.
        focal_length = w
        # This line defines optical center from frame midpoint.
        center = (w / 2.0, h / 2.0)
        # This array defines camera intrinsics for PnP.
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1],
        ], dtype=np.float64)
        # This array assumes no lens distortion for simplicity.
        dist_coeffs = np.zeros((4, 1), dtype=np.float64)
        # This line solves camera pose from 2D-3D correspondences.
        success, rotation_vector, _translation_vector = cv2.solvePnP(model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE)
        # This guard returns neutral angles when solvePnP fails.
        if not success:
            # This return provides safe fallback values.
            return 0.0, 0.0, 0.0
        # This line converts Rodrigues vector into a rotation matrix.
        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
        # This line derives projection matrix expected by decomposition function.
        projection_matrix = np.hstack((rotation_matrix, np.zeros((3, 1))))
        # This line decomposes projection matrix into Euler angles.
        _camera_matrix, _rot_matrix, _trans_vect, _rot_matrix_x, _rot_matrix_y, _rot_matrix_z, euler_angles = cv2.decomposeProjectionMatrix(projection_matrix)
        # This line extracts pitch in degrees from decomposition output.
        pitch = float(euler_angles[0])
        # This line extracts yaw in degrees from decomposition output.
        yaw = float(euler_angles[1])
        # This line extracts roll in degrees from decomposition output.
        roll = float(euler_angles[2])
        # This return sends all three pose dimensions.
        return pitch, yaw, roll

    # This method classifies temporal oscillation into grammatical modifiers.
    def _classify_motion(self, poses: List[FramePose]) -> Dict[str, object]:
        # This guard returns neutral output for empty pose lists.
        if not poses:
            # This return indicates no analyzable motion was found.
            return {"modifier": "undetermined", "confidence": 0.0, "reason": "No face detected consistently."}
        # This array collects pitch values across analyzed frames.
        pitch_values = np.array([pose.pitch for pose in poses], dtype=np.float64)
        # This array collects yaw values across analyzed frames.
        yaw_values = np.array([pose.yaw for pose in poses], dtype=np.float64)
        # This array collects roll values across analyzed frames.
        roll_values = np.array([pose.roll for pose in poses], dtype=np.float64)
        # This line computes pitch oscillation amplitude.
        pitch_amp = float(np.max(pitch_values) - np.min(pitch_values))
        # This line computes yaw oscillation amplitude.
        yaw_amp = float(np.max(yaw_values) - np.min(yaw_values))
        # This line computes roll oscillation amplitude.
        roll_amp = float(np.max(roll_values) - np.min(roll_values))
        # This dict maps dominant movement to final grammatical modifier.
        mapper = {
            "pitch": ("affirmation", "Detected nodding pattern."),
            "yaw": ("negation", "Detected shaking pattern."),
            "roll": ("question_uncertainty", "Detected tilting pattern."),
        }
        # This dict stores measured amplitudes per axis.
        amplitudes = {"pitch": pitch_amp, "yaw": yaw_amp, "roll": roll_amp}
        # This line chooses the axis with the strongest motion amplitude.
        dominant_axis = max(amplitudes, key=amplitudes.get)
        # This line reads the strongest amplitude value.
        dominant_value = amplitudes[dominant_axis]
        # This dict stores configured thresholds per axis.
        thresholds = {"pitch": self.pitch_threshold, "yaw": self.yaw_threshold, "roll": self.roll_threshold}
        # This line gets threshold for dominant axis.
        threshold = thresholds[dominant_axis]
        # This guard handles motion below confidence threshold.
        if dominant_value < threshold:
            # This return indicates that movement is too weak for reliable mapping.
            return {
                "modifier": "neutral",
                "confidence": float(max(0.05, dominant_value / max(threshold, 1e-6))),
                "reason": "Head movement amplitude below decision threshold.",
            }
        # This line maps dominant axis to grammatical label and explanation.
        modifier, reason = mapper[dominant_axis]
        # This line computes a bounded confidence score from amplitude ratio.
        confidence = float(min(0.99, dominant_value / (threshold * 1.8)))
        # This return provides final classifier output.
        return {"modifier": modifier, "confidence": confidence, "reason": reason}

    # This method runs full video analysis with a sliding temporal buffer.
    def analyze_video(self, video_path: str) -> Dict[str, object]:
        # This line creates OpenCV video capture from input path.
        capture = cv2.VideoCapture(video_path)
        # This guard handles unreadable or missing video files.
        if not capture.isOpened():
            # This return provides explicit file-access failure details.
            return {"modifier": "undetermined", "confidence": 0.0, "reason": "Could not open uploaded video.", "fps": 0.0, "total_frames": 0, "frames": []}
        # This line reads FPS metadata with a safe fallback.
        fps = float(capture.get(cv2.CAP_PROP_FPS) or 24.0)
        # This deque maintains a fixed-size temporal window of frame poses.
        window: Deque[FramePose] = deque(maxlen=self.window_size)
        # This list stores frame poses across the entire clip.
        all_poses: List[FramePose] = []
        # This line starts frame counter at zero.
        frame_index = 0
        # This line resets the frame timestamp.
        self._frame_timestamp_ms = 0
        # This line creates FaceLandmarker instance.
        face_landmarker = vision.FaceLandmarker.create_from_options(self._landmarker_options)
        # This loop iterates across all frames until video end.
        while True:
            # This line reads next frame from the capture stream.
            ok, frame = capture.read()
            # This guard exits loop when stream is exhausted.
            if not ok:
                # This break ends frame processing at EOF.
                break
            # This line extracts required landmarks for pose solving.
            extracted = self._extract_landmarks(frame, face_landmarker)
            # This guard skips frames with no detectable face.
            if extracted is None:
                # This line advances frame index even when skipped.
                frame_index += 1
                # This line updates timestamp for next frame.
                self._frame_timestamp_ms += int(1000 / fps)
                # This continue moves to next frame immediately.
                continue
            # This line unpacks pixel landmarks and normalized mesh points.
            image_points, mesh_points = extracted
            # This line solves pitch, yaw, and roll using PnP.
            pitch, yaw, roll = self._solve_euler(image_points, frame.shape)
            # This line computes frame timestamp from index and FPS.
            timestamp = frame_index / max(fps, 1.0)
            # This line builds a serializable frame pose object.
            pose = FramePose(frame_index=frame_index, timestamp=timestamp, pitch=pitch, yaw=yaw, roll=roll, mesh_points=mesh_points)
            # This line appends pose to sliding temporal window.
            window.append(pose)
            # This line stores pose in global sequence history.
            all_poses.append(pose)
            # This line advances frame index after processing.
            frame_index += 1
            # This line updates timestamp for next frame.
            self._frame_timestamp_ms += int(1000 / fps)
        # This line releases native video resources.
        capture.release()
        # This line closes the face landmarker.
        face_landmarker.close()
        # This line classifies global motion pattern from pose history.
        classification = self._classify_motion(all_poses)
        # This line downsamples frames to reduce API payload size.
        sampled_frames = all_poses[:: max(1, len(all_poses) // 80)] if all_poses else []
        # This return composes final API-ready analysis object.
        return {
            "modifier": classification["modifier"],
            "confidence": classification["confidence"],
            "reason": classification["reason"],
            "fps": fps,
            "total_frames": len(all_poses),
            "sequence": [[pose.pitch, pose.yaw, pose.roll] for pose in all_poses],
            "frames": [
                {
                    "frame_index": pose.frame_index,
                    "timestamp": pose.timestamp,
                    "pitch": pose.pitch,
                    "yaw": pose.yaw,
                    "roll": pose.roll,
                    "mesh_points": pose.mesh_points,
                }
                for pose in sampled_frames
            ],
        }
