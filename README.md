# FairLy

FairLy is an AI Bias Detection and Explainability Dashboard for uploading model prediction datasets, measuring group-level bias, and producing actionable remediation guidance.

## Stack

- Frontend: Next.js App Router, TailwindCSS, shadcn-style source components, Chart.js
- Backend: Python FastAPI, pandas, numpy, scikit-learn, fairlearn

## Project Structure

```text
backend/
  app/
    fairness.py      # Fairness metric computation and recommendations
    main.py          # FastAPI application
    schemas.py       # API request and response models
  tests/
frontend/
  src/app/           # Next.js App Router pages
  src/components/    # App shell and UI primitives
  src/lib/           # CSV parsing, API client, local storage helpers
  public/            # Sample CSV dataset
```

## Backend API

`POST /analyze`

Input:

```json
{
  "dataset": [{ "gender": "Male", "qualified": 1, "hired": 1 }],
  "target_column": "hired",
  "sensitive_attribute": "gender",
  "label_column": "qualified"
}
```

Output includes:

- `fairness_score`
- `statistical_parity_difference`
- `disparate_impact_ratio`
- `equal_opportunity_difference`
- `group_accuracy`
- `insights`
- `recommendations`

## Run Locally

Open two terminals.

### 1. Start the FastAPI backend

```powershell
cd "C:\Users\om\OneDrive\Documents\New project\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

### 2. Start the Next.js frontend

```powershell
cd "C:\Users\om\OneDrive\Documents\New project\frontend"
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo Flow

1. Go to Upload Data.
2. Click Use Sample Dataset.
3. Confirm target column is `hired`, sensitive attribute is `gender`, and ground truth is `qualified`.
4. Click Save Dataset.
5. Go to Bias Analysis and click Run Bias Scan.
6. Review the fairness score, metrics, group bar chart, insights, and recommendations.
7. Use Download PDF Report to open the browser print dialog and save the report as PDF.

## Fairness Logic

FairLy computes:

- Statistical parity difference: max group selection rate minus min group selection rate.
- Disparate impact ratio: min group selection rate divided by max group selection rate.
- Equal opportunity difference: max true-positive rate gap across groups when a label column is available.
- Group accuracy: accuracy by sensitive group when a label column is available.

The 0 to 100 fairness score combines parity, disparate impact, and equal opportunity penalties. Scores below 60 are treated as high risk, 60 to 79 as medium risk, and 80 or above as low risk.
