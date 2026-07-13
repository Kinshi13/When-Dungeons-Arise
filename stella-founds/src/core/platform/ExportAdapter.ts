export interface ExportAdapter {
  exportCsv(filename: string, rows: string[][]): Promise<void>;
}
