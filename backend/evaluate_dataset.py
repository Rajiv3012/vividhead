# This import provides argparse for command-line configuration.
import argparse
# This import provides CSV parsing for label metadata.
import csv
# This import provides JSON serialization for metrics output.
import json
# This import provides filesystem path utilities.
from pathlib import Path
# This import provides typing hints for cleaner function contracts.
from typing import Dict, List, Tuple

# This import provides sklearn metrics for evaluation reporting.
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_score, recall_score

# This import provides baseline rule-based analyzer implementation.
from head_logic import HeadMotionAnalyzer
# This import provides optional hybrid temporal classifier.
from hybrid_model import HybridTemporalClassifier


# This function loads labels mapping from CSV file.
def load_labels(label_csv: Path) -> Dict[str, str]:
    # This dictionary stores folder-to-label mappings.
    mapping: Dict[str, str] = {}
    # This line opens CSV file with UTF-8 decoding.
    with label_csv.open("r", encoding="utf-8", newline="") as handle:
        # This line creates CSV dict reader over header columns.
        reader = csv.DictReader(handle)
        # This loop iterates over each CSV row entry.
        for row in reader:
            # This line reads and trims folder column value.
            folder = (row.get("folder") or "").strip()
            # This line reads and trims label column value.
            label = (row.get("label") or "").strip()
            # This condition stores only valid mapping rows.
            if folder and label:
                # This line writes mapping pair into dictionary.
                mapping[folder] = label
    # This return emits complete folder-to-label mapping.
    return mapping


# This function evaluates baseline/hybrid predictions on dataset.
def evaluate(dataset_root: Path, label_map: Dict[str, str], use_hybrid: bool, hybrid_model_dir: Path | None) -> Dict[str, object]:
    # This line initializes baseline head analyzer instance.
    analyzer = HeadMotionAnalyzer()
    # This line initializes optional hybrid classifier reference.
    hybrid = HybridTemporalClassifier() if use_hybrid else None
    # This condition loads trained hybrid artifacts when requested.
    if hybrid and hybrid_model_dir:
        # This line loads persisted hybrid model from target directory.
        hybrid.load(str(hybrid_model_dir))
    # This list stores ground-truth labels for all evaluated samples.
    y_true: List[str] = []
    # This list stores predicted labels for all evaluated samples.
    y_pred: List[str] = []
    # This list stores per-sample confidence values for summary stats.
    confidences: List[float] = []
    # This loop iterates over labeled folders in deterministic order.
    for folder_name, target_label in sorted(label_map.items()):
        # This line constructs absolute path to current class folder.
        folder_path = dataset_root / folder_name
        # This guard skips missing dataset folders safely.
        if not folder_path.exists():
            # This continue skips absent folder entries.
            continue
        # This line gathers video files under current folder.
        videos = sorted([item for item in folder_path.iterdir() if item.suffix.lower() in {".mp4", ".mov", ".webm"}])
        # This loop runs inference over each video sample.
        for video in videos:
            # This line computes baseline analyzer output for video.
            baseline = analyzer.analyze_video(str(video))
            # This condition runs hybrid classifier when enabled.
            if hybrid:
                # This line predicts using calibrated hybrid sequence model.
                predicted_label, predicted_confidence = hybrid.predict_one(baseline.get("sequence", []))
            else:
                # This line uses baseline modifier as predicted label.
                predicted_label = str(baseline["modifier"])
                # This line uses baseline heuristic confidence as fallback.
                predicted_confidence = float(baseline["confidence"])
            # This line appends gold label to evaluation list.
            y_true.append(target_label)
            # This line appends predicted label to evaluation list.
            y_pred.append(predicted_label)
            # This line appends confidence score for summary.
            confidences.append(predicted_confidence)
    # This line computes sorted label list for stable matrices.
    labels = sorted(set(y_true) | set(y_pred))
    # This line computes confusion matrix with fixed label order.
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    # This line computes full classification report dictionary.
    report = classification_report(y_true, y_pred, labels=labels, output_dict=True, zero_division=0)
    # This return emits full metrics payload for logging/storage.
    return {
        "sample_count": len(y_true),
        "mode": "hybrid" if hybrid else "baseline",
        "labels": labels,
        "accuracy": float(accuracy_score(y_true, y_pred)) if y_true else 0.0,
        "precision_macro": float(precision_score(y_true, y_pred, average="macro", zero_division=0)) if y_true else 0.0,
        "recall_macro": float(recall_score(y_true, y_pred, average="macro", zero_division=0)) if y_true else 0.0,
        "f1_macro": float(f1_score(y_true, y_pred, average="macro", zero_division=0)) if y_true else 0.0,
        "f1_weighted": float(f1_score(y_true, y_pred, average="weighted", zero_division=0)) if y_true else 0.0,
        "mean_confidence": float(sum(confidences) / len(confidences)) if confidences else 0.0,
        "confusion_matrix": cm.tolist(),
        "classification_report": report,
    }


# This function creates reusable labels CSV template from dataset folders.
def write_label_template(dataset_root: Path, output_csv: Path) -> None:
    # This line collects folder names from dataset root.
    folders = sorted([item.name for item in dataset_root.iterdir() if item.is_dir()])
    # This line opens output CSV in write mode.
    with output_csv.open("w", encoding="utf-8", newline="") as handle:
        # This line creates CSV writer for template rows.
        writer = csv.writer(handle)
        # This line writes header expected by evaluation scripts.
        writer.writerow(["folder", "label"])
        # This loop writes one blank label row per folder.
        for folder in folders:
            # This line writes folder with empty label placeholder.
            writer.writerow([folder, ""])


# This function parses CLI arguments and executes requested action.
def main() -> None:
    # This line initializes argument parser metadata.
    parser = argparse.ArgumentParser(description="Evaluate VividHead baseline/hybrid performance on labeled dataset.")
    # This line adds dataset root path argument.
    parser.add_argument("--dataset-root", default="../dataset", help="Path to dataset root directory.")
    # This line adds labels CSV path argument.
    parser.add_argument("--labels-csv", default="dataset_labels.csv", help="CSV with columns: folder,label")
    # This line adds output metrics path argument.
    parser.add_argument("--output-json", default="metrics_report.json", help="Path to write metrics JSON output.")
    # This line adds optional template-generation switch.
    parser.add_argument("--write-template", action="store_true", help="Generate label template CSV and exit.")
    # This line adds hybrid evaluation mode switch.
    parser.add_argument("--use-hybrid", action="store_true", help="Use trained hybrid model for prediction.")
    # This line adds hybrid model directory path argument.
    parser.add_argument("--hybrid-model-dir", default="artifacts/hybrid", help="Directory containing trained hybrid artifacts.")
    # This line parses CLI arguments into namespace object.
    args = parser.parse_args()
    # This line resolves dataset root as absolute path.
    dataset_root = Path(args.dataset_root).resolve()
    # This line resolves labels CSV path as absolute path.
    labels_csv = Path(args.labels_csv).resolve()
    # This line resolves output metrics path as absolute path.
    output_json = Path(args.output_json).resolve()
    # This condition handles template-generation mode.
    if args.write_template:
        # This line writes a label template for manual annotation.
        write_label_template(dataset_root, labels_csv)
        # This line prints template completion location.
        print(f"Label template written to: {labels_csv}")
        # This return exits without running evaluation.
        return
    # This guard ensures labels CSV exists before evaluation.
    if not labels_csv.exists():
        # This line raises clear error for missing label mapping file.
        raise FileNotFoundError(f"Labels file not found: {labels_csv}. Run with --write-template first.")
    # This line loads folder-to-label mapping from CSV.
    label_map = load_labels(labels_csv)
    # This line runs baseline or hybrid evaluation over dataset.
    results = evaluate(dataset_root, label_map, args.use_hybrid, Path(args.hybrid_model_dir).resolve())
    # This line ensures parent directory exists for output file.
    output_json.parent.mkdir(parents=True, exist_ok=True)
    # This line writes formatted metrics JSON report to disk.
    output_json.write_text(json.dumps(results, indent=2), encoding="utf-8")
    # This line prints key summary metrics for quick terminal review.
    print(f"Mode: {results['mode']}")
    print(f"Samples: {results['sample_count']}")
    print(f"Accuracy: {results['accuracy']:.4f}")
    print(f"F1 Macro: {results['f1_macro']:.4f}")
    print(f"F1 Weighted: {results['f1_weighted']:.4f}")
    print(f"Report saved to: {output_json}")


# This guard runs main only when script is invoked directly.
if __name__ == "__main__":
    # This line starts CLI flow for evaluation utilities.
    main()
