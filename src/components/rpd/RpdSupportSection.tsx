import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import RpdField from "./RpdField";
import { RpdData } from "./rpdConfig";

interface Props {
  data: RpdData;
  patch: (p: Partial<RpdData>) => void;
}

const LIT: [keyof RpdData, string, string][] = [
  ["mainLit", "Основная литература", "Автор. Название. — Город: Издательство, Год. — ISBN"],
  ["addLit", "Дополнительная литература", "Автор. Название. — Город: Издательство, Год. — ISBN"],
  ["eResources", "Электронные образовательные ресурсы", "Название ресурса — адрес"],
  ["software", "Программное обеспечение (в т.ч. отечественное)", "Название ПО — назначение"],
  ["infoSystems", "Информационные справочные системы", "Название — адрес"],
  ["materials", "Материально-техническое обеспечение", "Оборудование аудиторий, лаборатории"],
];

const RpdSupportSection = ({ data, patch }: Props) => (
  <>
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm mb-6">
      <h2 className="font-display text-lg font-bold mb-4">5. Учебно-методическое обеспечение</h2>
      <div className="space-y-4">
        {LIT.map(([key, label, placeholder]) => (
          <RpdField key={key} label={label}>
            <Textarea rows={3} value={data[key] as string} onChange={(e) => patch({ [key]: e.target.value } as Partial<RpdData>)} placeholder={placeholder} />
          </RpdField>
        ))}
      </div>
    </section>

    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm mb-6">
      <h2 className="font-display text-lg font-bold mb-4">6. Разработчик РПД</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <RpdField label="ФИО разработчика">
          <Input value={data.developer} onChange={(e) => patch({ developer: e.target.value })} placeholder="Иванов И.И." />
        </RpdField>
        <RpdField label="Должность, учёная степень, звание">
          <Input value={data.developerPosition} onChange={(e) => patch({ developerPosition: e.target.value })} placeholder="доцент, к.пед.н." />
        </RpdField>
        <RpdField label="Организация">
          <Input value={data.organization} onChange={(e) => patch({ organization: e.target.value })} placeholder="Название вуза или колледжа" />
        </RpdField>
        <RpdField label="Кафедра / цикловая комиссия">
          <Input value={data.department} onChange={(e) => patch({ department: e.target.value })} />
        </RpdField>
        <RpdField label="Год утверждения">
          <Input type="number" min={2000} max={2100} value={data.approvalYear} onChange={(e) => patch({ approvalYear: e.target.value })} />
        </RpdField>
      </div>
    </section>
  </>
);

export default RpdSupportSection;
