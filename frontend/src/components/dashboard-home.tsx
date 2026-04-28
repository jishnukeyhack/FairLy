"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Database } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { loadAnalysis, loadRunCount } from "@/lib/storage";
import type { AnalyzeResponse } from "@/types/analysis";

export function DashboardHome() {
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [runCount, setRunCount] = useState(0);

  useEffect(() => {
    setAnalysis(loadAnalysis());
    setRunCount(loadRunCount());
  }, []);

  const alerts = analysis?.risk_level === "high" ? 3 : analysis?.risk_level === "medium" ? 1 : 0;
  const score = analysis?.fairness_score ?? 88;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline">Explainable AI</Badge>
            <Badge variant={analysis ? "success" : "secondary"}>{analysis ? "Live workspace" : "Demo ready"}</Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-normal">FairLy Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Monitor model decisions, detect hidden group-level bias, and turn fairness metrics into concrete remediation steps.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={Activity}
          label="Total Analyses Run"
          value={runCount.toString()}
          detail="Stored locally for this workspace"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Bias Alerts Detected"
          value={alerts.toString()}
          detail={alerts > 0 ? "Review recommendations" : "No active high-risk alerts"}
        />
        <MetricCard
          icon={CheckCircle2}
          label="Average Fairness Score"
          value={`${score}/100`}
          detail="Composite parity and opportunity score"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <Card>
          <CardHeader>
            <CardTitle>Current Fairness Posture</CardTitle>
            <CardDescription>Latest scan summary and risk status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Composite score</span>
              <span className="font-mono text-sm">{score}%</span>
            </div>
            <Progress value={score} />
            <div className="grid gap-3 md:grid-cols-3">
              <Signal label="Statistical parity" value={analysis?.metrics.statistical_parity_difference ?? 0.08} />
              <Signal label="Disparate impact" value={analysis?.metrics.disparate_impact_ratio ?? 0.91} />
              <Signal label="Equal opportunity" value={analysis?.metrics.equal_opportunity_difference ?? 0.05} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>Dataset readiness.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium">{analysis ? "Analysis available" : "No scan yet"}</div>
                <div className="text-xs text-muted-foreground">Upload a CSV or use the sample dataset.</div>
              </div>
            </div>
            <div className="rounded-md border border-border bg-background p-3 font-mono text-xs text-muted-foreground">
              fairness.scan.status = {analysis ? `"${analysis.risk_level}"` : `"idle"`}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function Signal({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono text-lg">{Number(value).toFixed(2)}</div>
    </div>
  );
}
