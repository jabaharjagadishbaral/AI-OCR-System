import ExcelJS from "exceljs";
import { Parser as CsvParser } from "json2csv";

export function toJSON(doc) {
  return Buffer.from(JSON.stringify(doc, null, 2), "utf-8");
}

export function toCSV(doc) {
  const rows = doc.pages.map((p) => ({
    page_number: p.page_number,
    text: p.text,
    confidence: p.confidence,
  }));
  const parser = new CsvParser({ fields: ["page_number", "text", "confidence"] });
  return Buffer.from(parser.parse(rows), "utf-8");
}

export async function toXLSX(doc) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("OCR Result");
  sheet.columns = [
    { header: "Page", key: "page_number", width: 8 },
    { header: "Text", key: "text", width: 80 },
    { header: "Confidence", key: "confidence", width: 12 },
  ];
  doc.pages.forEach((p) => sheet.addRow(p));
  sheet.getRow(1).font = { bold: true };
  return workbook.xlsx.writeBuffer();
}
