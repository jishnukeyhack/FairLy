export type DatasetRow = Record<string, string | number | boolean | null>;

export type StoredDataset = {
  rows: DatasetRow[];
  columns: string[];
  targetColumn?: string;
  sensitiveAttribute?: string;
  labelColumn?: string;
  uploadedAt: string;
};

export type GroupComparison = {
  group: string;
  selection_rate: number;
  accuracy: number | null;
  count: number;
};

export type AnalyzeResponse = {
  fairness_score: number;
  risk_level: "low" | "medium" | "high";
  metrics: {
    statistical_parity_difference: number;
    disparate_impact_ratio: number;
    equal_opportunity_difference: number;
    group_accuracy: Record<string, number>;
    selection_rates: Record<string, number>;
  };
  groups: GroupComparison[];
  insights: string[];
  recommendations: string[];
  label_column_used: string | null;
};
