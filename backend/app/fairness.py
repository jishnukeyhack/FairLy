from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd
from fairlearn.metrics import MetricFrame, selection_rate
from sklearn.metrics import accuracy_score


LABEL_CANDIDATES = (
    "actual",
    "actual_outcome",
    "label",
    "ground_truth",
    "qualified",
    "y_true",
    "outcome",
)


@dataclass(frozen=True)
class FairnessResult:
    fairness_score: int
    risk_level: str
    metrics: dict[str, Any]
    groups: list[dict[str, Any]]
    insights: list[str]
    recommendations: list[str]
    label_column_used: str | None


def analyze_dataset(
    rows: list[dict[str, Any]],
    target_column: str,
    sensitive_attribute: str,
    label_column: str | None = None,
) -> FairnessResult:
    frame = pd.DataFrame(rows).replace({"": np.nan})
    _validate_input(frame, target_column, sensitive_attribute, label_column)

    usable = frame.dropna(subset=[target_column, sensitive_attribute]).copy()
    if usable.empty:
        raise ValueError("No usable rows remain after removing missing target or sensitive values.")

    y_pred = _to_binary(usable[target_column], target_column)
    sensitive = usable[sensitive_attribute].astype(str)

    label_column_used = _resolve_label_column(usable, target_column, sensitive_attribute, label_column)
    y_true = _to_binary(usable[label_column_used], label_column_used) if label_column_used else None

    metric_frame = MetricFrame(
        metrics={"selection_rate": selection_rate},
        y_true=y_pred,
        y_pred=y_pred,
        sensitive_features=sensitive,
    )
    selection_rates = _series_to_float_dict(metric_frame.by_group["selection_rate"])

    group_accuracy = _compute_group_accuracy(y_true, y_pred, sensitive) if y_true is not None else {}
    statistical_parity_difference = _max_rate_gap(selection_rates)
    disparate_impact_ratio = _disparate_impact(selection_rates)
    equal_opportunity_difference = (
        _equal_opportunity_gap(y_true, y_pred, sensitive) if y_true is not None else statistical_parity_difference
    )

    fairness_score = _score_bias(
        statistical_parity_difference,
        disparate_impact_ratio,
        equal_opportunity_difference,
    )
    risk_level = _risk_level(fairness_score)

    groups = [
        {
            "group": group,
            "selection_rate": round(float(rate), 4),
            "accuracy": round(float(group_accuracy[group]), 4) if group in group_accuracy else None,
            "count": int((sensitive == group).sum()),
        }
        for group, rate in sorted(selection_rates.items())
    ]

    insights = _build_insights(
        selection_rates,
        statistical_parity_difference,
        disparate_impact_ratio,
        equal_opportunity_difference,
        label_column_used,
    )
    recommendations = _build_recommendations(
        fairness_score,
        statistical_parity_difference,
        disparate_impact_ratio,
        equal_opportunity_difference,
        label_column_used,
    )

    return FairnessResult(
        fairness_score=fairness_score,
        risk_level=risk_level,
        metrics={
            "statistical_parity_difference": round(statistical_parity_difference, 4),
            "disparate_impact_ratio": round(disparate_impact_ratio, 4),
            "equal_opportunity_difference": round(equal_opportunity_difference, 4),
            "group_accuracy": {key: round(float(value), 4) for key, value in sorted(group_accuracy.items())},
            "selection_rates": {key: round(float(value), 4) for key, value in sorted(selection_rates.items())},
        },
        groups=groups,
        insights=insights,
        recommendations=recommendations,
        label_column_used=label_column_used,
    )


def _validate_input(
    frame: pd.DataFrame,
    target_column: str,
    sensitive_attribute: str,
    label_column: str | None,
) -> None:
    missing = [column for column in (target_column, sensitive_attribute) if column not in frame.columns]
    if missing:
        raise ValueError(f"Missing required column(s): {', '.join(missing)}")
    if label_column and label_column not in frame.columns:
        raise ValueError(f"Missing label column: {label_column}")
    if frame[sensitive_attribute].dropna().nunique() < 2:
        raise ValueError("Sensitive attribute must contain at least two groups.")


def _to_binary(series: pd.Series, column_name: str) -> pd.Series:
    normalized = series.astype(str).str.strip().str.lower()
    positive_values = {
        "1",
        "true",
        "yes",
        "y",
        "approved",
        "accept",
        "accepted",
        "selected",
        "hired",
        "pass",
        "passed",
        "positive",
        "qualified",
        "eligible",
    }
    negative_values = {
        "0",
        "false",
        "no",
        "n",
        "denied",
        "reject",
        "rejected",
        "not selected",
        "not_hired",
        "failed",
        "negative",
        "unqualified",
        "ineligible",
    }

    mapped = normalized.map(lambda value: 1 if value in positive_values else 0 if value in negative_values else np.nan)
    numeric = pd.to_numeric(series, errors="coerce")

    if mapped.isna().all() and numeric.notna().any():
        unique_values = sorted(numeric.dropna().unique())
        if set(unique_values).issubset({0, 1}):
            return numeric.astype(int)
        median = float(numeric.median())
        return (numeric >= median).astype(int)

    if mapped.isna().any():
        unknown_examples = ", ".join(sorted(normalized[mapped.isna()].unique())[:4])
        raise ValueError(
            f"Column '{column_name}' must be binary or numeric. Unrecognized values: {unknown_examples}"
        )

    return mapped.astype(int)


def _resolve_label_column(
    frame: pd.DataFrame,
    target_column: str,
    sensitive_attribute: str,
    label_column: str | None,
) -> str | None:
    if label_column and label_column not in {target_column, sensitive_attribute}:
        return label_column

    normalized_lookup = {column.lower(): column for column in frame.columns}
    for candidate in LABEL_CANDIDATES:
        resolved = normalized_lookup.get(candidate)
        if resolved and resolved not in {target_column, sensitive_attribute}:
            return resolved
    return None


def _series_to_float_dict(series: pd.Series) -> dict[str, float]:
    return {str(key): float(value) for key, value in series.dropna().items()}


def _max_rate_gap(rates: dict[str, float]) -> float:
    if not rates:
        return 0.0
    return float(max(rates.values()) - min(rates.values()))


def _disparate_impact(rates: dict[str, float]) -> float:
    if not rates:
        return 1.0
    max_rate = max(rates.values())
    min_rate = min(rates.values())
    if max_rate == 0:
        return 1.0
    return float(min_rate / max_rate)


def _compute_group_accuracy(
    y_true: pd.Series,
    y_pred: pd.Series,
    sensitive: pd.Series,
) -> dict[str, float]:
    accuracy_by_group: dict[str, float] = {}
    for group in sorted(sensitive.unique()):
        mask = sensitive == group
        accuracy_by_group[str(group)] = float(accuracy_score(y_true[mask], y_pred[mask]))
    return accuracy_by_group


def _equal_opportunity_gap(
    y_true: pd.Series,
    y_pred: pd.Series,
    sensitive: pd.Series,
) -> float:
    true_positive_rates: list[float] = []
    for group in sorted(sensitive.unique()):
        mask = (sensitive == group) & (y_true == 1)
        if mask.sum() == 0:
            continue
        true_positive_rates.append(float(y_pred[mask].mean()))
    if len(true_positive_rates) < 2:
        return 0.0
    return max(true_positive_rates) - min(true_positive_rates)


def _score_bias(
    statistical_parity_difference: float,
    disparate_impact_ratio: float,
    equal_opportunity_difference: float,
) -> int:
    parity_penalty = min(statistical_parity_difference / 0.35, 1.0) * 40
    impact_penalty = min(max(0.0, 0.8 - disparate_impact_ratio) / 0.8, 1.0) * 35
    opportunity_penalty = min(equal_opportunity_difference / 0.35, 1.0) * 25
    return int(round(max(0.0, 100 - parity_penalty - impact_penalty - opportunity_penalty)))


def _risk_level(score: int) -> str:
    if score >= 80:
        return "low"
    if score >= 60:
        return "medium"
    return "high"


def _build_insights(
    selection_rates: dict[str, float],
    statistical_parity_difference: float,
    disparate_impact_ratio: float,
    equal_opportunity_difference: float,
    label_column_used: str | None,
) -> list[str]:
    if not selection_rates:
        return ["No sensitive groups were available for comparison."]

    favored_group = max(selection_rates, key=selection_rates.get)
    disadvantaged_group = min(selection_rates, key=selection_rates.get)
    delta = statistical_parity_difference * 100

    insights = [
        (
            f"The model favors {favored_group} by {delta:.1f} percentage points compared "
            f"with {disadvantaged_group}."
        ),
        (
            f"The disparate impact ratio is {disparate_impact_ratio:.2f}; values below 0.80 "
            "usually require deeper review under the four-fifths guideline."
        ),
    ]

    if label_column_used:
        insights.append(
            f"Equal opportunity differs by {equal_opportunity_difference * 100:.1f} percentage points "
            f"among qualified or positive-label records using '{label_column_used}'."
        )
    else:
        insights.append(
            "No ground-truth label column was supplied, so equal opportunity is estimated from selection-rate gaps."
        )

    return insights


def _build_recommendations(
    fairness_score: int,
    statistical_parity_difference: float,
    disparate_impact_ratio: float,
    equal_opportunity_difference: float,
    label_column_used: str | None,
) -> list[str]:
    recommendations = [
        "Rebalance the dataset so each sensitive group has enough positive and negative examples.",
        "Remove or audit proxy features that may encode sensitive attributes indirectly.",
    ]

    if disparate_impact_ratio < 0.8:
        recommendations.append("Apply reweighting techniques to increase representation for the lowest-selection group.")
    if statistical_parity_difference > 0.1:
        recommendations.append("Add fairness constraints during model selection and tune thresholds by group impact.")
    if equal_opportunity_difference > 0.1 and label_column_used:
        recommendations.append("Optimize for equal opportunity by monitoring true-positive rates across groups.")
    if fairness_score < 70:
        recommendations.append("Require a human fairness review before deploying this model into production.")

    return recommendations
