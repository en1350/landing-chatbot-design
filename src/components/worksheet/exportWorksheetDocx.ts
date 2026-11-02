import { WorksheetMeta, WorksheetTask } from "./worksheetConfig";

const LETTERS = ["А", "Б", "В", "Г", "Д", "Е"];
const FONT = "Times New Roman";

export async function exportWorksheetDocx(meta: WorksheetMeta, tasks: WorksheetTask[], filename: string) {
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = await import("docx");

  const run = (text: string, opts: { bold?: boolean; size?: number; italics?: boolean } = {}) =>
    new TextRun({ text, font: FONT, size: opts.size ?? 24, bold: opts.bold, italics: opts.italics });

  const para = (text: string, opts: { bold?: boolean; size?: number; center?: boolean; after?: number; indent?: number } = {}) =>
    new Paragraph({
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { after: opts.after ?? 120 },
      indent: opts.indent ? { left: opts.indent } : undefined,
      children: [run(text, opts)],
    });

  const cell = (text: string, bold = false, center = false, width?: number) =>
    new TableCell({
      width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
      children: [
        new Paragraph({
          alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { before: 60, after: 60 },
          children: [run(text, { bold, size: 22 })],
        }),
      ],
    });

  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [];

  children.push(para((meta.topic.trim() || "Тема урока").toUpperCase(), { bold: true, size: 32, center: true, after: 60 }));
  children.push(para("Рабочий лист для самостоятельной работы", { center: true, after: 240 }));
  children.push(
    para(
      `Группа: ${meta.group.trim() || "_________"}     Преподаватель: ${meta.teacher.trim() || "_________"}     Дата: «___» __________ 20__ г.`,
      { size: 22, after: 240 }
    )
  );

  tasks.forEach((task, index) => {
    children.push(para(`Задание ${index + 1}. ${task.title}`, { bold: true, after: 80 }));
    task.description
      .split("\n")
      .filter((l) => l.trim())
      .forEach((l) => children.push(para(l, { indent: 360, after: 60 })));

    if (task.type === "choice") {
      task.options
        .filter((o) => o.trim())
        .forEach((o, i) => children.push(para(`☐ ${LETTERS[i] || i + 1}) ${o}`, { indent: 360, after: 40 })));
    } else if (task.type === "table") {
      const cols = task.columns.filter((c) => c.trim());
      const headers = cols.length ? cols : ["", ""];
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: headers.map((h) => cell(h, true)) }),
            ...Array.from({ length: task.rows }).map(() => new TableRow({ height: { value: 500, rule: "atLeast" }, children: headers.map(() => cell("")) })),
          ],
        })
      );
    } else {
      for (let i = 0; i < 3; i++) {
        children.push(
          new Paragraph({
            spacing: { after: 120 },
            indent: { left: 360 },
            border: { bottom: { style: BorderStyle.DOTTED, size: 6, color: "000000", space: 4 } },
            children: [run(" ")],
          })
        );
      }
    }
    children.push(para("", { after: 120 }));
  });

  if (meta.withCriteria) {
    const list = meta.criteria.filter((c) => c.trim());
    children.push(para("Критерии оценки и самооценка", { bold: true, after: 80 }));
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [cell("Критерий", true, false, 55), cell("Да", true, true, 15), cell("Частично", true, true, 15), cell("Нет", true, true, 15)] }),
          ...list.map((c) => new TableRow({ children: [cell(c, false, false, 55), cell("☐", false, true, 15), cell("☐", false, true, 15), cell("☐", false, true, 15)] })),
        ],
      })
    );
    children.push(para("", { after: 80 }));
    children.push(para("Моя оценка: ________     Оценка преподавателя: ________", { size: 22 }));
  }

  children.push(para("Желаю успехов в выполнении работы!", { center: true, size: 20 }));

  const doc = new Document({
    sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children }],
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
