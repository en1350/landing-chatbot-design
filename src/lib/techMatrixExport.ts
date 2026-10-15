import { MatrixData, TechRow } from "@/components/tech-matrix/techMatrixConfig";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[<>&"']/g, (m) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[m] as string));

export const matrixProf = (d: MatrixData) => (d.prof === "Другая (указать)" ? d.profOther : d.prof);

const metaPairs = (d: MatrixData): [string, string][] => {
  const meta: [string, string][] = [
    ["Преподаватель", d.author],
    ["Организация", d.org],
    ["Дата", d.date],
    ["Предмет / дисциплина", d.subject],
    ["Профессиональная направленность", matrixProf(d)],
    ["Курс / группа", d.course],
  ];
  if (d.fgos.on) {
    meta.push(
      ["ФГОС СПО — учитывается", "Да"],
      ["Профессия / специальность", d.fgos.code],
      ["Уровень", d.fgos.level],
      ["Реквизиты ФГОС", d.fgos.order],
      ["ОК / ПК", d.fgos.komps],
      ["Учтённые требования", d.fgos.req],
    );
  } else {
    meta.push(["ФГОС СПО", "Не учитывалось"]);
  }
  return meta.filter(([, v]) => v);
};

const download = (blob: Blob, name: string) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
};

export const matrixFileName = (d: MatrixData, ext: string) => {
  const base = (d.docTitle || d.subject || "Матрица_технологий").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60);
  return `${base}_${new Date().toISOString().slice(0, 10)}.${ext}`;
};

export const filledRows = (rows: TechRow[]) => rows.filter((r) => r.t.trim() || r.o.trim() || r.r.trim());

export function downloadMatrixExcel(d: MatrixData) {
  const S = "urn:schemas-microsoft-com:office:spreadsheet";
  const cell = (v: unknown, st?: string) =>
    `<Cell${st ? ` ss:StyleID="${st}"` : ""}><Data ss:Type="String">${esc(v)}</Data></Cell>`;
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="${S}" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="${S}" xmlns:html="http://www.w3.org/TR/REC-html40">
<Styles>
<Style ss:ID="title"><Font ss:Bold="1" ss:Size="14" ss:Color="#1E4285"/></Style>
<Style ss:ID="hdr"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#2B5AA8" ss:Pattern="Solid"/><Alignment ss:Vertical="Center" ss:WrapText="1"/></Style>
<Style ss:ID="lbl"><Font ss:Bold="1"/><Alignment ss:Vertical="Top" ss:WrapText="1"/></Style>
<Style ss:ID="cell"><Alignment ss:Vertical="Top" ss:WrapText="1"/></Style>
</Styles><Worksheet ss:Name="Технологии"><Table><Column ss:Width="34"/><Column ss:Width="190"/><Column ss:Width="270"/><Column ss:Width="280"/>`;
  xml += `<Row ss:Height="24"><Cell ss:StyleID="title" ss:MergeAcross="3"><Data ss:Type="String">${esc(d.docTitle || "Матрица используемых технологий обучения")}</Data></Cell></Row>`;
  metaPairs(d).forEach(([k, v]) => {
    xml += `<Row>${cell(k, "lbl")}<Cell ss:StyleID="cell" ss:MergeAcross="2"><Data ss:Type="String">${esc(v)}</Data></Cell></Row>`;
  });
  xml += `<Row ss:Height="6"></Row>`;
  xml += `<Row ss:Height="32">${cell("№", "hdr")}${cell("Технология", "hdr")}${cell("Обоснование выбора технологии", "hdr")}${cell("Методическая и практическая результативность применения технологии", "hdr")}</Row>`;
  filledRows(d.rows).forEach((r, i) => {
    xml += `<Row>${cell(i + 1, "cell")}${cell(r.t, "cell")}${cell(r.o, "cell")}${cell(r.r, "cell")}</Row>`;
  });
  xml += `</Table></Worksheet></Workbook>`;
  download(new Blob(["\ufeff" + xml], { type: "application/vnd.ms-excel;charset=utf-8" }), matrixFileName(d, "xls"));
}

export function downloadMatrixCsv(d: MatrixData) {
  const q = (v: unknown) => '"' + String(v ?? "").replace(/"/g, '""') + '"';
  const out: unknown[][] = [[d.docTitle || "Матрица используемых технологий обучения"]];
  metaPairs(d).forEach(([k, v]) => out.push([k, v]));
  out.push([]);
  out.push(["№", "Технология", "Обоснование выбора технологии", "Методическая и практическая результативность применения технологии"]);
  filledRows(d.rows).forEach((r, i) => out.push([i + 1, r.t, r.o, r.r]));
  const text = out.map((r) => r.map(q).join(";")).join("\r\n");
  download(new Blob(["\ufeff" + text], { type: "text/csv;charset=utf-8" }), matrixFileName(d, "csv"));
}

export function matrixToText(d: MatrixData): string {
  const head = metaPairs(d).map(([k, v]) => `${k}: ${v}`);
  const body = filledRows(d.rows).map(
    (r, i) => `${i + 1}. ${r.t}\nОбоснование выбора: ${r.o}\nРезультативность: ${r.r}`,
  );
  return [...head, "", ...body].join("\n\n");
}
