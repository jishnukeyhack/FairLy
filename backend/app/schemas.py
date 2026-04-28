from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    dataset: list[dict[str, Any]] = Field(..., min_length=2)
    target_column: str = Field(..., min_length=1)
    sensitive_attribute: str = Field(..., min_length=1)
    label_column: str | None = None


class FairnessMetrics(BaseModel):
    statistical_parity_difference: float
    disparate_impact_ratio: float
    equal_opportunity_difference: float
    group_accuracy: dict[str, float]
    selection_rates: dict[str, float]


class GroupComparison(BaseModel):
    group: str
    selection_rate: float
    accuracy: float | None = None
    count: int


class AnalyzeResponse(BaseModel):
    fairness_score: int
    risk_level: str
    metrics: FairnessMetrics
    groups: list[GroupComparison]
    insights: list[str]
    recommendations: list[str]
    label_column_used: str | None = None
