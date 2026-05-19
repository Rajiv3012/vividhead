import json
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

def plot_confusion_matrix(json_path: Path, output_image_path: Path, title: str):
    if not json_path.exists():
        print(f"Metrics not found at {json_path}")
        return

    with json_path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    
    cm = np.array(data["confusion_matrix"])
    labels = data["labels"]

    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=labels, yticklabels=labels)
    plt.xlabel('Predicted Label')
    plt.ylabel('True Label')
    plt.title(f'Confusion Matrix: {title}')
    plt.tight_layout()
    plt.savefig(output_image_path, dpi=300)
    plt.close()
    print(f"Saved {title} matrix to {output_image_path}")

if __name__ == "__main__":
    base_dir = Path(__file__).parent.resolve()
    
    # Baseline
    baseline_json = base_dir / "baseline_metrics.json"
    baseline_png = base_dir / "baseline_matrix.png"
    plot_confusion_matrix(baseline_json, baseline_png, "Baseline Model")
    
    # Hybrid
    hybrid_json = base_dir / "hybrid_metrics.json"
    hybrid_png = base_dir / "hybrid_matrix.png"
    plot_confusion_matrix(hybrid_json, hybrid_png, "Hybrid Model")
