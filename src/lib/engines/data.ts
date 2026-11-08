/** Pure, synchronous data transforms. Safe to run anywhere (browser, worker, desktop shell). */

export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const candidates = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const d of candidates) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      best = d;
      bestCount = count;
    }
  }
  return best;
}

/** RFC 4180-style CSV parser supporting quoted fields, escaped quotes and newlines inside quotes. */
export function parseCsv(text: string, delimiter = detectDelimiter(text)): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }
    if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (inQuotes) throw new Error("A quoted field is never closed. Check for a missing \" character.");
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

function coerce(value: string): unknown {
  const v = value.trim();
  if (v === "") return "";
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null") return null;
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(v)) return Number(v);
  return value;
}

export type CsvToJsonOptions = { typed?: boolean; indent?: number };

export function csvToJson(text: string, opts: CsvToJsonOptions = {}): string {
  const { typed = true, indent = 2 } = opts;
  const rows = parseCsv(text);
  if (rows.length === 0) throw new Error("The CSV file is empty.");
  const headers = rows[0]!.map((h, i) => h.trim() || `column_${i + 1}`);
  const records = rows.slice(1).map((r) => {
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const raw = r[i] ?? "";
      obj[h] = typed ? coerce(raw) : raw;
    });
    return obj;
  });
  return JSON.stringify(records, null, indent);
}

function flatten(value: unknown, prefix = "", out: Record<string, unknown> = {}) {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else if (Array.isArray(value)) {
    out[prefix] = JSON.stringify(value);
  } else {
    out[prefix] = value;
  }
  return out;
}

function escapeCsv(value: unknown, delimiter: string) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (s.includes('"') || s.includes(delimiter) || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function jsonToCsv(text: string, delimiter = ","): string {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`This isn't valid JSON: ${(e as Error).message}`);
  }
  const list = Array.isArray(data) ? data : [data];
  if (list.length === 0) throw new Error("The JSON array is empty.");
  const flat: Record<string, unknown>[] = list.map((item) =>
    item !== null && typeof item === "object" ? flatten(item) : { value: item },
  );
  const headers: string[] = [];
  for (const row of flat) for (const k of Object.keys(row)) if (!headers.includes(k)) headers.push(k);
  const lines = [headers.map((h) => escapeCsv(h, delimiter)).join(delimiter)];
  for (const row of flat) lines.push(headers.map((h) => escapeCsv(row[h], delimiter)).join(delimiter));
  return lines.join("\n");
}

export function formatJson(text: string, indent: number | "minify" = 2): string {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error(`This isn't valid JSON: ${(e as Error).message}`);
  }
  return indent === "minify" ? JSON.stringify(data) : JSON.stringify(data, null, indent);
}
