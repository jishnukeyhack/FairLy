"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileText, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { loadAnalysis, loadRunCount } from "@/lib/storage";
import type { AnalyzeResponse } from "@/types/analysis";

export default function ReportsPage() {
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [runCount, setRunCount] = useState(0);

  useEffect(() => {
    setAnalysis(loadAnalysis());
    setRunCount(loadRunCount());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">Reports</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Exportable fairness evidence for review boards, model risk teams, and compliance handoffs.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()} disabled={!analysis} className="no-print">
          <Download className="h-4 w-4" />
          Download PDF Report
        </Button>
      </div>

      {analysis ? (
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle>FairLy Bias Analysis Report</CardTitle>
              <CardDescription>Generated from the latest workspace scan.</CardDescription>
            </div>
            <Badge variant={analysis.risk_level === "low" ? "success" : analysis.risk_level === "medium" ? "warning" : "danger"}>
              {analysis.risk_level.toUpperCase()} RISK
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <ReportStat label="Analyses run" value={runCount.toString()} />
              <ReportStat label="Fairness score" value={`${analysis.fairness_score}/100`} />
              <ReportStat label="Parity diff" value={analysis.metrics.statistical_parity_difference.toFixed(2)} />
              <ReportStat label="Impact ratio" value={analysis.metrics.disparate_impact_ratio.toFixed(2)} />
            </div>

            <Separator />

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Executive Summary</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Latest scan produced a fairness score of {analysis.fairness_score}/100 with {analysis.risk_level} risk.
                The report evaluates group-level selection rates and highlights disparities that should be reviewed before deployment.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Key Insights</h2>
              {analysis.insights.map((insight) => (
                <div key={insight} className="rounded-md border border-border bg-background p-3 text-sm leading-6">
                  {insight}
                </div>
              ))}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Recommended Remediation</h2>
              {analysis.recommendations.map((recommendation) => (
                <div key={recommendation} className="rounded-md border border-border bg-background p-3 text-sm leading-6">
                  {recommendation}
                </div>
              ))}
            </section>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
            <FileText className="h-10 w-10 text-primary" />
            <div className="text-lg font-medium">No report available</div>
            <p className="max-w-md text-sm text-muted-foreground">Run a bias scan to generate an exportable report.</p>
            <Button asChild>
              <Link href="/analysis">
                <ShieldCheck className="h-4 w-4" />
                Open Analysis
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono text-xl">{value}</div>
    </div>
  );
}
