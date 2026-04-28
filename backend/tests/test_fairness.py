from app.fairness import analyze_dataset


def test_analyze_dataset_detects_group_gap() -> None:
    rows = [
        {"gender": "Male", "hired": 1, "qualified": 1},
        {"gender": "Male", "hired": 1, "qualified": 1},
        {"gender": "Male", "hired": 1, "qualified": 0},
        {"gender": "Female", "hired": 0, "qualified": 1},
        {"gender": "Female", "hired": 0, "qualified": 1},
        {"gender": "Female", "hired": 1, "qualified": 0},
    ]

    result = analyze_dataset(rows, "hired", "gender", "qualified")

    assert result.fairness_score < 80
    assert result.metrics["statistical_parity_difference"] > 0.4
    assert result.label_column_used == "qualified"
