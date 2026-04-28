"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type DragEvent } from "react";
import Link from "next/link";
import { Check, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { parseCsv } from "@/lib/csv";
import { loadDataset, saveDataset } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { DatasetRow, StoredDataset } from "@/types/analysis";

export default function UploadPage() {
  const [rows, setRows] = useState<DatasetRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [targetColumn, setTargetColumn] = useState("");
  const [sensitiveAttribute, setSensitiveAttribute] = useState("");
  const [labelColumn, setLabelColumn] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  useEffect(() => {
    const stored = loadDataset();
    if (stored) {
      setRows(stored.rows);
      setColumns(stored.columns);
      setTargetColumn(stored.targetColumn ?? "");
      setSensitiveAttribute(stored.sensitiveAttribute ?? "");
      setLabelColumn(stored.labelColumn ?? "");
    }
  }, []);

  const previewRows = useMemo(() => rows.slice(0, 8), [rows]);

  async function loadFile(file: File) {
    try {
      const csv = await file.text();
      const parsed = parseCsv(csv);
      setRows(parsed.rows);
      setColumns(parsed.columns);
      setTargetColumn("");
      setSensitiveAttribute("");
      setLabelColumn("");
      setMessage(`${parsed.rows.length} rows loaded from ${file.name}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not parse CSV.");
    }
  }

  async function loadSample() {
    setIsLoadingSample(true);
    try {
      const response = await fetch("/sample-applicant-data.csv");
      const csv = await response.text();
      const parsed = parseCsv(csv);
      setRows(parsed.rows);
      setColumns(parsed.columns);
      setTargetColumn("hired");
      setSensitiveAttribute("gender");
      setLabelColumn("qualified");
      setMessage("Sample applicant dataset loaded.");
    } catch {
      setMessage("Could not load sample dataset.");
    } finally {
      setIsLoadingSample(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void loadFile(file);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void loadFile(file);
  }

  function persistDataset() {
    const dataset: StoredDataset = {
      rows,
      columns,
      targetColumn,
      sensitiveAttribute,
      labelColumn,
      uploadedAt: new Date().toISOString(),
    };
    saveDataset(dataset);
    setMessage("Dataset settings saved. You can run the bias scan now.");
  }

  const canSave = rows.length > 0 && targetColumn && sensitiveAttribute;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal">Upload Data</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Upload model predictions as CSV, choose the decision column, and identify the sensitive attribute to audit.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>CSV Intake</CardTitle>
            <CardDescription>Drag and drop a CSV file or start with the built-in sample dataset.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background p-6 text-center transition-colors hover:border-primary/70",
                isDragging && "border-primary bg-primary/10",
              )}
            >
              <UploadCloud className="mb-4 h-10 w-10 text-primary" />
              <span className="text-sm font-medium">Drop CSV here or click to browse</span>
              <span className="mt-2 text-xs text-muted-foreground">Columns should include predictions and group attributes.</span>
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="outline" onClick={loadSample} disabled={isLoadingSample}>
                {isLoadingSample ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Use Sample Dataset
              </Button>
              <Button type="button" onClick={persistDataset} disabled={!canSave}>
                <Check className="h-4 w-4" />
                Save Dataset
              </Button>
            </div>

            {message ? (
              <div className="rounded-md border border-border bg-background p-3 text-sm text-muted-foreground">{message}</div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Column Mapping</CardTitle>
            <CardDescription>Select the model decision, sensitive attribute, and optional ground-truth label.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="target">Target column</Label>
              <Select id="target" value={targetColumn} onChange={(event) => setTargetColumn(event.target.value)}>
                <option value="">Select target</option>
                {columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sensitive">Sensitive attribute</Label>
              <Select
                id="sensitive"
                value={sensitiveAttribute}
                onChange={(event) => setSensitiveAttribute(event.target.value)}
              >
                <option value="">Select attribute</option>
                {columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Ground truth</Label>
              <Select id="label" value={labelColumn} onChange={(event) => setLabelColumn(event.target.value)}>
                <option value="">Auto-detect</option>
                {columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Dataset Preview</CardTitle>
            <CardDescription>{rows.length ? `${rows.length} rows loaded` : "No dataset loaded yet"}</CardDescription>
          </div>
          {canSave ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/analysis">Open Analysis</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Open Analysis
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {previewRows.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewRows.map((row, index) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column}>{String(row[column] ?? "")}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex min-h-48 items-center justify-center rounded-lg border border-border bg-background text-sm text-muted-foreground">
              Upload a CSV to preview rows here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
