/**
 * Utility functions for exporting data to CSV format
 */

type CSVValue = string | number | boolean | null | undefined;

/**
 * Escapes a value for CSV format
 * - Wraps in quotes if contains comma, quote, or newline
 * - Escapes quotes by doubling them
 */
function escapeCSVValue(value: CSVValue): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check if value needs to be quoted
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Converts an array of objects to CSV string
 */
export function toCSV<T extends Record<string, CSVValue>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
): string {
  if (data.length === 0) {
    return columns.map((col) => escapeCSVValue(col.header)).join(',');
  }

  // Header row
  const header = columns.map((col) => escapeCSVValue(col.header)).join(',');

  // Data rows
  const rows = data.map((row) =>
    columns.map((col) => escapeCSVValue(row[col.key])).join(','),
  );

  return [header, ...rows].join('\n');
}

/**
 * Downloads a CSV string as a file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel compatibility with UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Formats a date for use in filenames
 */
export function formatDateForFilename(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}
