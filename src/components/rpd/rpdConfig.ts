export interface RpdKtpRow {
  id: number;
  topic: string;
  total: number;
  lect: number;
  pract: number;
  lab: number;
  self: number;
  control: string;
}

export interface RpdCompetency {
  id: number;
  code: string;
  text: string;
  tool: string;
}

export interface RpdData {
  disciplineName: string;
  disciplineCode: string;
  fgos: string;
  direction: string;
  programName: string;
  profile: string;
  course: string;
  semester: string;
  totalHours: string;
  credits: string;
  attestationType: string;
  language: string;
  prereq: string;
  postreq: string;
  goal: string;
  tasks: string;
  structure: string;
  hoursLecture: string;
  hoursPractice: string;
  hoursLab: string;
  hoursSelf: string;
  hoursControl: string;
  currentControl: string;
  intermediateControl: string;
  criteria: string;
  sampleTasks: string;
  evalMethods: string;
  mainLit: string;
  addLit: string;
  eResources: string;
  software: string;
  infoSystems: string;
  materials: string;
  developer: string;
  developerPosition: string;
  organization: string;
  department: string;
  approvalYear: string;
  competencies: RpdCompetency[];
  ktp: RpdKtpRow[];
}

export const COURSES = ["1", "2", "3", "4", "5", "6"];
export const ATTESTATIONS = ["Экзамен", "Зачет", "Дифференцированный зачет", "Защита курсовой работы", "Защита проекта"];
export const LANGUAGES = ["Русский", "Английский", "Билингвальный"];

let counter = Date.now();
export const nextId = () => ++counter;

export const emptyKtpRow = (patch: Partial<RpdKtpRow> = {}): RpdKtpRow => ({
  id: nextId(),
  topic: "",
  total: 0,
  lect: 0,
  pract: 0,
  lab: 0,
  self: 0,
  control: "",
  ...patch,
});

export const emptyCompetency = (patch: Partial<RpdCompetency> = {}): RpdCompetency => ({
  id: nextId(),
  code: "",
  text: "",
  tool: "",
  ...patch,
});

export const emptyRpd = (): RpdData => ({
  disciplineName: "",
  disciplineCode: "",
  fgos: "",
  direction: "",
  programName: "",
  profile: "",
  course: "",
  semester: "",
  totalHours: "",
  credits: "",
  attestationType: "",
  language: "Русский",
  prereq: "",
  postreq: "",
  goal: "",
  tasks: "",
  structure: "",
  hoursLecture: "",
  hoursPractice: "",
  hoursLab: "",
  hoursSelf: "",
  hoursControl: "",
  currentControl: "",
  intermediateControl: "",
  criteria: "",
  sampleTasks: "",
  evalMethods: "",
  mainLit: "",
  addLit: "",
  eResources: "",
  software: "",
  infoSystems: "",
  materials: "",
  developer: "",
  developerPosition: "",
  organization: "",
  department: "",
  approvalYear: String(new Date().getFullYear()),
  competencies: [emptyCompetency()],
  ktp: [emptyKtpRow()],
});

export const num = (v: string | number) => Number(v) || 0;

export const hoursTotal = (d: RpdData) =>
  num(d.hoursLecture) + num(d.hoursPractice) + num(d.hoursLab) + num(d.hoursSelf) + num(d.hoursControl);

export const ktpTotals = (rows: RpdKtpRow[]) =>
  rows.reduce(
    (a, r) => ({
      total: a.total + num(r.total),
      lect: a.lect + num(r.lect),
      pract: a.pract + num(r.pract),
      lab: a.lab + num(r.lab),
      self: a.self + num(r.self),
    }),
    { total: 0, lect: 0, pract: 0, lab: 0, self: 0 },
  );

export const mergeRpd = (raw: Partial<RpdData>): RpdData => {
  const base = emptyRpd();
  const merged = { ...base, ...raw };
  merged.competencies = (raw.competencies && raw.competencies.length ? raw.competencies : base.competencies).map((c) =>
    emptyCompetency(c),
  );
  merged.ktp = (raw.ktp && raw.ktp.length ? raw.ktp : base.ktp).map((r) => emptyKtpRow(r));
  return merged;
};
