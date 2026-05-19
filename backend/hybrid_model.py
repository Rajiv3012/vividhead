# This import provides JSON serialization for persisted model artifacts.
import json
# This import provides filesystem path operations.
from pathlib import Path
# This import provides typing hints for cleaner interfaces.
from typing import Dict, List, Sequence, Tuple

# This import provides numerical array operations.
import numpy as np
# This import provides calibrated linear classifier components.
from sklearn.calibration import CalibratedClassifierCV
# This import provides linear classifier for compact training.
from sklearn.linear_model import LogisticRegression
# This import provides label encoding for string classes.
from sklearn.preprocessing import LabelEncoder


# This class wraps a lightweight temporal feature classifier pipeline.
class HybridTemporalClassifier:
    # This constructor initializes empty model and encoder references.
    def __init__(self) -> None:
        # This field stores fitted label encoder instance.
        self.label_encoder = LabelEncoder()
        # This field stores fitted calibrated classifier instance.
        self.classifier: CalibratedClassifierCV | None = None

    # This method extracts compact temporal features from angle sequences.
    def _extract_features(self, sequence: Sequence[Sequence[float]]) -> np.ndarray:
        # This guard handles empty sequences with zero feature vector.
        if not sequence:
            # This return keeps vector size stable for missing data cases.
            return np.zeros(18, dtype=np.float64)
        # This line converts nested sequence into numeric array.
        data = np.asarray(sequence, dtype=np.float64)
        # This line computes mean values per axis.
        means = np.mean(data, axis=0)
        # This line computes standard deviations per axis.
        stds = np.std(data, axis=0)
        # This line computes min values per axis.
        mins = np.min(data, axis=0)
        # This line computes max values per axis.
        maxs = np.max(data, axis=0)
        # This line computes oscillation amplitudes per axis.
        amps = maxs - mins
        # This line computes frame-to-frame temporal deltas.
        deltas = np.diff(data, axis=0) if len(data) > 1 else np.zeros((1, 3), dtype=np.float64)
        # This line computes mean absolute speed per axis.
        avg_speed = np.mean(np.abs(deltas), axis=0)
        # This line concatenates all feature groups into one vector.
        features = np.concatenate([means, stds, amps, mins, maxs, avg_speed], axis=0)
        # This return emits the final fixed-length feature vector.
        return features.astype(np.float64)

    # This method fits calibrated classifier using labeled sequences.
    def fit(self, sequences: List[Sequence[Sequence[float]]], labels: List[str]) -> None:
        # This line transforms all sequences into feature matrix rows.
        feature_matrix = np.vstack([self._extract_features(sequence) for sequence in sequences])
        # This line encodes string labels into classifier-friendly integers.
        y = self.label_encoder.fit_transform(labels)
        # This line creates base linear classifier for fast convergence.
        base = LogisticRegression(max_iter=300, class_weight="balanced")
        # This line wraps base model with sigmoid calibration.
        calibrated = CalibratedClassifierCV(base, method="sigmoid", cv=3)
        # This line trains calibrated classifier on extracted features.
        calibrated.fit(feature_matrix, y)
        # This line stores fitted calibrated classifier on the instance.
        self.classifier = calibrated

    # This method predicts class and calibrated confidence for one sequence.
    def predict_one(self, sequence: Sequence[Sequence[float]]) -> Tuple[str, float]:
        # This guard ensures model is trained before prediction usage.
        if self.classifier is None:
            # This exception explains missing training artifact requirement.
            raise RuntimeError("Hybrid classifier has not been trained yet.")
        # This line converts incoming sequence into feature row matrix.
        features = self._extract_features(sequence).reshape(1, -1)
        # This line computes calibrated class probabilities.
        probabilities = self.classifier.predict_proba(features)[0]
        # This line finds most probable class index.
        class_index = int(np.argmax(probabilities))
        # This line decodes integer class index back to string label.
        label = str(self.label_encoder.inverse_transform([class_index])[0])
        # This line reads top probability as confidence score.
        confidence = float(probabilities[class_index])
        # This return provides class prediction and confidence pair.
        return label, confidence

    # This method saves trained model metadata and parameters to disk.
    def save(self, output_dir: str) -> None:
        # This guard ensures classifier exists before persistence.
        if self.classifier is None:
            # This exception prevents saving empty model states.
            raise RuntimeError("Cannot save hybrid classifier before training.")
        # This line creates output directory path object.
        target = Path(output_dir)
        # This line ensures output directory exists for file writes.
        target.mkdir(parents=True, exist_ok=True)
        # This line imports joblib lazily for model serialization.
        import joblib

        # This line saves classifier artifact to joblib file.
        joblib.dump(self.classifier, target / "hybrid_classifier.joblib")
        # This line saves label classes for decode consistency.
        (target / "label_classes.json").write_text(json.dumps(self.label_encoder.classes_.tolist(), indent=2), encoding="utf-8")

    # This method loads persisted model artifacts from disk.
    def load(self, model_dir: str) -> None:
        # This line creates path object from provided directory string.
        target = Path(model_dir)
        # This line imports joblib lazily for model deserialization.
        import joblib

        # This line loads previously saved classifier artifact.
        self.classifier = joblib.load(target / "hybrid_classifier.joblib")
        # This line reads serialized label class names from disk.
        classes = json.loads((target / "label_classes.json").read_text(encoding="utf-8"))
        # This line restores label encoder classes for decoding.
        self.label_encoder.classes_ = np.asarray(classes)
