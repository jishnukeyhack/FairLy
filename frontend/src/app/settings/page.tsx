"use client";

import { useState } from "react";
import { KeyRound, Server, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const defaultApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState(defaultApiUrl);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Configure fairness thresholds, API routing, and governance metadata for the workspace.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                API Configuration
              </CardTitle>
              <Badge variant="outline">Local</Badge>
            </div>
            <CardDescription>Frontend calls the FastAPI analysis service.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api">Analysis API URL</Label>
              <Input id="api" value={apiUrl} onChange={(event) => setApiUrl(event.target.value)} />
            </div>
            <div className="rounded-md border border-border bg-background p-3 font-mono text-xs text-muted-foreground">
              NEXT_PUBLIC_API_BASE_URL={apiUrl}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Fairness Guardrails
            </CardTitle>
            <CardDescription>Default review thresholds used by FairLy recommendations.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="impact">Disparate impact floor</Label>
              <Select id="impact" defaultValue="0.80">
                <option value="0.80">0.80</option>
                <option value="0.85">0.85</option>
                <option value="0.90">0.90</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parity">Parity gap alert</Label>
              <Select id="parity" defaultValue="0.10">
                <option value="0.10">0.10</option>
                <option value="0.15">0.15</option>
                <option value="0.20">0.20</option>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            Governance
          </CardTitle>
          <CardDescription>Audit ownership fields for generated reports.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="owner">Model owner</Label>
            <Input id="owner" placeholder="Risk Analytics" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="system">AI system</Label>
            <Input id="system" placeholder="Candidate Screener v2" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">Review region</Label>
            <Input id="region" placeholder="US" />
          </div>
          <div className="md:col-span-3">
            <Button>Save Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
