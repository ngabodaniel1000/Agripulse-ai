import { jsPDF } from "jspdf";
export function exportPDF(title: string, text: string) {
  const pdf = new jsPDF();
  pdf.setFontSize(11);
  pdf.text("NISR | Agricultural Market Intelligence", 18, 20);
  pdf.setFontSize(19);
  pdf.text(title, 18, 35);
  pdf.setFontSize(10);
  const lines = pdf.splitTextToSize(text, 174);
  let y = 49;
  for (const line of lines) {
    if (y > 275) {
      pdf.addPage();
      y = 20;
    }
    pdf.text(line, 18, y);
    y += 6;
  }
  pdf.save(title.toLowerCase().replace(/[^a-z0-9]+/g, "-") + ".pdf");
}
export function exportCSV(
  rows: Record<string, string | number>[],
  fileName = "nisr-crop-adoption.csv",
) {
  const first = rows[0];
  if (!first) return;
  const headers = Object.keys(first);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((k) => '"' + String(row[k]).replaceAll('"', '""') + '"').join(","),
    ),
  ].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
