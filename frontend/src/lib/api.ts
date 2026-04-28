import type { AnalyzeResponse, StoredDataset } from "@/types/analysis";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function runBiasAnalysis(dataset: StoredDataset): Promise<AnalyzeResponse> {
  if (!dataset.targetColumn || !dataset.sensitiveAttribute) {
    throw new Error("Select a target column and sensitive attribute before running analysis.");
  }

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dataset: dataset.rows,
      target_column: dataset.targetColumn,
      sensitive_attribute: dataset.sensitiveAttribute,
      label_column: dataset.labelColumn || undefined,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(payload?.detail ?? "Bias analysis failed.");
  }

  return response.json() as Promise<AnalyzeResponse>;
}
