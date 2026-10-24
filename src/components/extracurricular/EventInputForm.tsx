import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Icon from "@/components/ui/icon";
import { YEARS, ACTIVITY_TYPES } from "@/components/extracurricular/types";

interface EventInputFormProps {
  year: string;
  setYear: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  subject: string;
  setSubject: (v: string) => void;
  group: string;
  setGroup: (v: string) => void;
  total: string;
  setTotal: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  desc: string;
  setDesc: (v: string) => void;
  participants: string;
  setParticipants: (v: string) => void;
  rowsCount: number;
  onAdd: () => void;
  onLoadDemo: () => void;
  onClearAll: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
}

const EventInputForm = ({
  year,
  setYear,
  date,
  setDate,
  subject,
  setSubject,
  group,
  setGroup,
  total,
  setTotal,
  type,
  setType,
  desc,
  setDesc,
  participants,
  setParticipants,
  rowsCount,
  onAdd,
  onLoadDemo,
  onClearAll,
  onExportBackup,
  onImportBackup,
}: EventInputFormProps) => (
  <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm">
    <h2 className="font-display text-lg font-bold mb-4">Добавить мероприятие</h2>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label className="block text-sm font-semibold mb-1.5">Учебный год</label>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">Дата</label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">Вид деятельности</label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ACTIVITY_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <label className="block text-sm font-semibold mb-1.5">Наименование УД / МДК / ПМ / практики</label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Например: Основы реабилитации" />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">Группа</label>
        <Input value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Например: 234" />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">Численность группы</label>
        <Input type="number" min={1} value={total} onChange={(e) => setTotal(e.target.value)} placeholder="24" />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1.5">Участников</label>
        <Input type="number" min={0} value={participants} onChange={(e) => setParticipants(e.target.value)} placeholder="18" />
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <label className="block text-sm font-semibold mb-1.5">Описание мероприятия</label>
        <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} placeholder="Например: мастер-класс «СЛР»" />
      </div>
    </div>

    <div className="flex flex-wrap gap-2 mt-5">
      <Button className="gap-2 w-full sm:w-auto" onClick={onAdd}>
        <Icon name="Plus" size={16} />
        Добавить
      </Button>
      <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={onLoadDemo}>
        <Icon name="Sparkles" size={16} />
        Загрузить пример
      </Button>
      <Button variant="ghost" className="gap-2 w-full sm:w-auto text-destructive hover:text-destructive" onClick={onClearAll}>
        <Icon name="Trash2" size={16} />
        Очистить всё
      </Button>
    </div>

    <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
      <div className="flex items-start gap-2 mb-3">
        <Icon name="Save" size={16} className="text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">
          Таблица сохраняется автоматически в этом браузере
          {rowsCount > 0 && <> — сейчас записей: <b className="text-foreground">{rowsCount}</b></>}.
          Чтобы перенести данные на другой компьютер, сделайте резервную копию.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onExportBackup}>
          <Icon name="HardDriveDownload" size={15} />
          Сохранить копию
        </Button>
        <label className="inline-flex">
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportBackup(f);
              e.target.value = "";
            }}
          />
          <span className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent transition-colors">
            <Icon name="HardDriveUpload" size={15} />
            Восстановить из копии
          </span>
        </label>
      </div>
    </div>
  </div>
);

export default EventInputForm;
