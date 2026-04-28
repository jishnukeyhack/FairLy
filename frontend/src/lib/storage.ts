import type { AnalyzeResponse, StoredDataset } from "@/types/analysis";

const DATASET_KEY = "fairly.dataset";
const ANALYSIS_KEY = "fairly.lastAnalysis";
const RUN_COUNT_KEY = "fairly.runCount";

export function saveDataset(dataset: StoredDataset) {
  window.localStorage.setItem(DATASET_KEY, JSON.stringify(dataset));
}

export function loadDataset(): StoredDataset | null {
  const raw = window.localStorage.getItem(DATASET_KEY);
  return raw ? (JSON.parse(raw) as StoredDataset) : null;
}

export function saveAnalysis(analysis: AnalyzeResponse) {
  window.localStorage.setItem(ANALYSIS_KEY, JSON.stringify(analysis));
  const current = Number(window.localStorage.getItem(RUN_COUNT_KEY) ?? "0");
  window.localStorage.setItem(RUN_COUNT_KEY, String(current + 1));
}

export function loadAnalysis(): AnalyzeResponse | null {
  const raw = window.localStorage.getItem(ANALYSIS_KEY);
  return raw ? (JSON.parse(raw) as AnalyzeResponse) : null;
}

export function loadRunCount() {
  return Number(window.localStorage.getItem(RUN_COUNT_KEY) ?? "0");
}
