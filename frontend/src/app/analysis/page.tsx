"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Download,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { runBiasAnalysis } from "@/lib/api";
import { loadAnalysis, loadDataset, saveAnalysis } from "@/lib/storage";
import type { AnalyzeResponse, StoredDataset } from "@/types/analysis";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function AnalysisPage() {
  const [dataset, setDataset] = useState<StoredDataset | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDataset(loadDataset());
    setAnalysis(loadAnalysis());
  }, []);

  async function handleRunScan() {
    if (!dataset) {
      setError("Upload a dataset before running a bias scan.");
      return;
    }

    setIsRunning(true);
    setError(null);
    try {
      const result = await runBiasAnalysis(dataset);
      saveAnalysis(result);
      setAnalysis(result);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Bias scan failed.");
    } finally {
      setIsRunning(false);
    }
  }

  const chartData = useMemo(() => {
    const groups = analysis?.groups ?? [];
    return {
      labels: groups.map((group) => group.group),
      datasets: [
        {
          label: "Selection rate",
          data: groups.map((group) => Math.round(group.selection_rate * 100)),
          backgroundColor: groups.map((_, index) => (index % 2 === 0 ? "rgba(99, 102, 241, 0.82)" : "rgba(56, 189, 248, 0.82)")),
          borderColor: "rgba(255,255,255,0.14)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  }, [analysis]);

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: { color: "rgba(255,255,255,0.68)" },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: "rgba(255,255,255,0.07)" },
        ticks: {
          color: "rgba(255,255,255,0.68)",
          callback: (value) => `${value}%`,
        },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y}%`,
        },
      },
    },
  };

  const score = analysis?.fairness_score ?? 0;
  const scoreVariant: "success" | "warning" | "danger" = score >= 80 ? "success" : score >= 60 ? "warning" : "danger";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Bias Analysis</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Run a fairness scan across model decisions and compare outcomes by sensitive group.
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" onClick={() => window.print()} disabled={!analysis}>
            <Download className="h-4 w-4" />
            Download PDF Report
          </Button>
          <Button onClick={handleRunScan} disabled={isRunning || !dataset}>
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
            Run Bias Scan
          </Button>
        </div>
      </div>

      {!dataset ? (
        <Card>
          <CardContent className="flex min-h-44 flex-col items-center justify-center gap-3 text-center">
            <ShieldAlert className="h-8 w-8 text-primary" />
            <div className="font-medium">No dataset selected</div>
            <p className="max-w-md text-sm text-muted-foreground">Upload a CSV or load the sample dataset before running analysis.</p>
            <Button asChild>
              <Link href="/upload">Upload Data</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isRunning ? (
        <Card>
          <CardContent className="flex min-h-40 items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
            <div>
              <div className="font-medium">AI analyzing bias...</div>
              <div className="mt-1 text-sm text-muted-foreground">Computing parity, impact ratios, group accuracy, and explainability notes.</div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      ) : null}

      {analysis ? (
        <>
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Fairness Score</CardTitle>
                  <Badge variant={scoreVariant}>{analysis.risk_level.toUpperCase()} RISK</Badge>
                </div>
                <CardDescription>Composite score across parity, impact, and opportunity metrics.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-semibold">{analysis.fairness_score}</span>
                  <span className="pb-2 text-sm text-muted-foreground">/ 100</span>
                </div>
                <Progress value={analysis.fairness_score} />
                <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">
                  Label source: {analysis.label_column_used ?? "estimated without ground truth"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Group Selection Rates</CardTitle>
                <CardDescription>Bar chart comparing positive model decisions by group.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Metric
              title="Statistical Parity Difference"
              value={analysis.metrics.statistical_parity_difference}
              format="decimal"
            />
            <Metric title="Disparate Impact Ratio" value={analysis.metrics.disparate_impact_ratio} format="decimal" />
            <Metric
              title="Equal Opportunity Difference"
              value={analysis.metrics.equal_opportunity_difference}
              format="decimal"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Insights Panel</CardTitle>
                <CardDescription>Plain-language explanation generated from the fairness metrics.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.insights.map((insight) => (
                  <div key={insight} className="flex gap-3 rounded-md border border-border bg-background p-3 text-sm leading-6">
                    <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{insight}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations Panel</CardTitle>
                <CardDescription>Actionable fixes before production deployment.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.recommendations.map((recommendation) => (
                  <div key={recommendation} className="flex gap-3 rounded-md border border-border bg-background p-3 text-sm leading-6">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{recommendation}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Group Metrics</CardTitle>
              <CardDescription>Selection rate, sample count, and accuracy when labels are available.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group</TableHead>
                    <TableHead>Selection rate</TableHead>
                    <TableHead>Accuracy</TableHead>
                    <TableHead>Rows</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analysis.groups.map((group) => (
                    <TableRow key={group.group}>
                      <TableCell className="font-medium">{group.group}</TableCell>
                      <TableCell>{Math.round(group.selection_rate * 100)}%</TableCell>
                      <TableCell>{group.accuracy === null ? "N/A" : `${Math.round(group.accuracy * 100)}%`}</TableCell>
                      <TableCell>{group.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function Metric({ title, value, format }: { title: string; value: number; format: "decimal" }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="font-mono text-2xl">{format === "decimal" ? value.toFixed(2) : value}</div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {value > 0.2 ? <AlertTriangle className="h-3.5 w-3.5 text-amber-300" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}
          {value > 0.2 ? "Needs review" : "Within guardrail"}
        </div>
      </CardContent>
    </Card>
  );
}
