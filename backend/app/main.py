from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.fairness import analyze_dataset
from app.schemas import AnalyzeRequest, AnalyzeResponse


app = FastAPI(
    title="FairLy Bias Analysis API",
    description="Fairness metrics and explainability service for uploaded datasets and model predictions.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
def analyze(payload: AnalyzeRequest) -> AnalyzeResponse:
    try:
        result = analyze_dataset(
            rows=payload.dataset,
            target_column=payload.target_column,
            sensitive_attribute=payload.sensitive_attribute,
            label_column=payload.label_column,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return AnalyzeResponse(
        fairness_score=result.fairness_score,
        risk_level=result.risk_level,
        metrics=result.metrics,
        groups=result.groups,
        insights=result.insights,
        recommendations=result.recommendations,
        label_column_used=result.label_column_used,
    )
