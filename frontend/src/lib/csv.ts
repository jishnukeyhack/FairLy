import type { DatasetRow } from "@/types/analysis";

export function parseCsv(csv: string): { columns: string[]; rows: DatasetRow[] } {
  const records = tokenizeCsv(csv.trim());
  if (records.length < 2) {
    throw new Error("CSV must contain a header row and at least one data row.");
  }

  const columns = records[0].map((header) => header.trim()).filter(Boolean);
  if (columns.length === 0) {
    throw new Error("CSV header row is empty.");
  }

  const rows = records.slice(1).map((record) => {
    return columns.reduce<DatasetRow>((row, column, index) => {
      row[column] = coerceCell(record[index] ?? "");
      return row;
    }, {});
  });

  return { columns, rows };
}

function tokenizeCsv(input: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  row.push(current);
  rows.push(row);
  return rows.filter((record) => record.some((cell) => cell.trim().length > 0));
}

function coerceCell(value: string) {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === "true";
  return trimmed;
}
