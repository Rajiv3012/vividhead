# This import provides argparse support for CLI training workflow.
import argparse
# This import provides CSV parsing for label mappings.
import csv
# This import provides filesystem path helpers.
from pathlib import Path
# This import provides list and dictionary type hints.
from typing import Dict, List

# This import provides train/test split helper.
from sklearn.model_selection import train_test_split

# This import provides baseline sequence extraction logic.
from head_logic import HeadMotionAnalyzer
# This import provides calibrated hybrid temporal classifier.
from hybrid_model import HybridTemporalClassifier


# This function loads folder-to-label pairs from labels CSV.
def load_labels(label_csv: Path) -> Dict[str, str]:
    # This dictionary stores parsed CSV mappings.
    mapping: Dict[str, str] = {}
    # This line opens labels CSV with UTF-8 decoding.
    with label_csv.open("r", encoding="utf-8", newline="") as handle:
        # This line creates dictionary reader for labeled rows.
        reader = csv.DictReader(handle)
        # This loop iterates over CSV mapping rows.
        for row in reader:
            # This line reads folder column as cleaned text.
            folder = (row.get("folder") or "").strip()
            # This line reads label column as cleaned text.
            label = (row.get("label") or "").strip()
            # This condition stores only rows with both values.
            if folder and label:
                # This line inserts valid mapping into dictionary.
                mapping[folder] = label
    # This return emits folder label mapping dictionary.
    return mapping


# This function builds sequence dataset using baseline analyzer extraction.
def build_training_data(dataset_root: Path, label_map: Dict[str, str]) -> tuple[List[List[List[float]]], List[str]]:
    # This line initializes analyzer for sequence extraction.
    analyzer = HeadMotionAnalyzer()
    # This list stores extracted per-video angle sequences.
    sequences: List[List[List[float]]] = []
    # This list stores target labels aligned with sequences.
    labels: List[str] = []
    # This loop iterates through labeled folders deterministically.
    for folder_name, target_label in sorted(label_map.items()):
        # This line builds current class directory path.
        folder_path = dataset_root / folder_name
        # This guard skips folders not found in dataset.
        if not folder_path.exists():
            # This continue moves to next mapping entry.
            continue
        # This line lists candidate video files for training.
        videos = sorted([item for item in folder_path.iterdir() if item.suffix.lower() in {".mp4", ".mov", ".webm"}])
        # This loop extracts one sequence per video sample.
        for video in videos:
            # This line runs baseline analyzer to gather full sequence.
            result = analyzer.analyze_video(str(video))
            # This line reads sequence from analyzer return payload.
            sequence = result.get("sequence", [])
            # This guard keeps only videos with valid sequence data.
            if sequence:
                # This line appends sequence to training feature list.
                sequences.append(sequence)
                # This line appends matching class label.
                labels.append(target_label)
    # This return provides features and targets for training phase.
    return sequences, labels


# This function runs hybrid training and quick holdout evaluation.
def main() -> None:
    # This line creates parser for hybrid training CLI arguments.
    parser = argparse.ArgumentParser(description="Train VividHead hybrid temporal classifier.")
    # This line adds dataset root argument.
    parser.add_argument("--dataset-root", default="../dataset", help="Path to dataset root.")
    # This line adds labels CSV mapping path argument.
    parser.add_argument("--labels-csv", default="dataset_labels.csv", help="CSV with folder,label columns.")
    # This line adds model output artifact directory argument.
    parser.add_argument("--output-dir", default="artifacts/hybrid", help="Output directory for trained artifacts.")
    # This line adds random seed argument for reproducibility.
    parser.add_argument("--seed", type=int, default=42, help="Random seed for train/test split.")
    # This line parses command-line inputs.
    args = parser.parse_args()
    # This line resolves dataset root path to absolute path.
    dataset_root = Path(args.dataset_root).resolve()
    # This line resolves labels CSV path to absolute path.
    labels_csv = Path(args.labels_csv).resolve()
    # This guard blocks training when labels file is absent.
    if not labels_csv.exists():
        # This line raises explicit file-not-found guidance.
        raise FileNotFoundError(f"Labels CSV not found: {labels_csv}")
    # This line loads folder-to-label mapping from CSV.
    label_map = load_labels(labels_csv)
    # This line builds sequence dataset from labeled videos.
    sequences, labels = build_training_data(dataset_root, label_map)
    # This guard checks minimum samples before training starts.
    if len(sequences) < 12:
        # This line raises clear message for insufficient dataset size.
        raise ValueError("Not enough labeled samples to train hybrid model. Provide at least 12 videos.")
    # This line creates train/test split for quick health check.
    x_train, x_test, y_train, y_test = train_test_split(sequences, labels, test_size=0.2, random_state=args.seed, stratify=labels)
    # This line initializes hybrid classifier instance.
    model = HybridTemporalClassifier()
    # This line fits classifier on training split data.
    model.fit(x_train, y_train)
    # This line persists trained classifier artifacts to disk.
    model.save(args.output_dir)
    # This list stores holdout predicted labels.
    predicted_labels: List[str] = []
    # This loop runs quick predictions over test split.
    for sequence in x_test:
        # This line predicts label and confidence for one sample.
        predicted_label, _confidence = model.predict_one(sequence)
        # This line appends predicted label for reporting.
        predicted_labels.append(predicted_label)
    # This import provides quick classification summary output.
    from sklearn.metrics import classification_report

    # This line prints holdout classification summary to terminal.
    print(classification_report(y_test, predicted_labels, zero_division=0))
    # This line prints model artifact output location.
    print(f"Hybrid model saved to: {Path(args.output_dir).resolve()}")


# This guard runs training only for direct script execution.
if __name__ == "__main__":
    # This line starts hybrid training workflow.
    main()
