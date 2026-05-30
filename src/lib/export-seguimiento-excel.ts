import * as XLSX from "xlsx";
import type { SeguimientoConfig } from "./seguimiento-config";

type Animal = { numero: string; nombre: string | null };

const formatValue = (value: unknown, fieldType: string, options?: { value: string; label: string }[]): string | number => {
  if (value === null || value === undefined || value === "") return "";
  if (fieldType === "date") {
    const str = String(value);
    return str.length >= 10 ? str.slice(0, 10) : str;
  }
  if (fieldType === "number") {
    const num = Number(value);
    return Number.isFinite(num) ? num : String(value);
  }
  if (fieldType === "select" && options) {
    const opt = options.find((o) => o.value === String(value));
    return opt ? opt.label : String(value);
  }
  return String(value);
};

const sanitizeFilename = (s: string) => s.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");

export const exportSeguimientoToExcel = ({
  config,
  animal,
  rows,
}: {
  config: SeguimientoConfig;
  animal: Animal;
  rows: Record<string, unknown>[];
}) => {
  const exportableFields = config.fields.filter((f) => f.type !== "file");
  const today = new Date().toISOString().slice(0, 10);
  const animalLabel = `${animal.numero}${animal.nombre ? ` - ${animal.nombre}` : ""}`;

  const aoa: (string | number)[][] = [
    ["Animal", animalLabel],
    ["Sección", config.title],
    ["Fecha de exportación", today],
    ["Total de registros", rows.length],
    [],
    exportableFields.map((f) => f.label),
    ...rows.map((row) =>
      exportableFields.map((f) => formatValue(row[f.name], f.type, f.options))
    ),
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Column widths: max of header and data length, capped
  ws["!cols"] = exportableFields.map((f, i) => {
    const headerLen = f.label.length;
    const dataMax = rows.reduce((max, row) => {
      const v = String(formatValue(row[f.name], f.type, f.options) ?? "");
      return Math.max(max, v.length);
    }, 0);
    const width = Math.min(Math.max(headerLen, dataMax, 12) + 2, 40);
    // Ensure first two columns wide enough for meta labels
    if (i === 0) return { wch: Math.max(width, 20) };
    return { wch: width };
  });

  const wb = XLSX.utils.book_new();
  const sheetName = config.title.slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const filename = `${sanitizeFilename(config.tipo)}_${sanitizeFilename(animal.numero)}_${today}.xlsx`;
  XLSX.writeFile(wb, filename);
};
