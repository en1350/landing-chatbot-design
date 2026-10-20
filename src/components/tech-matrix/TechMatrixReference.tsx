import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";
import { TECH_REFERENCE, TechRow } from "@/components/tech-matrix/techMatrixConfig";

interface TechMatrixReferenceProps {
  showRef: boolean;
  onToggle: () => void;
  addRow: (row?: TechRow) => void;
}

const TechMatrixReference = ({ showRef, onToggle, addRow }: TechMatrixReferenceProps) => (
  <section className="rounded-2xl border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm no-print">
    <button
      type="button"
      className="flex w-full items-center justify-between text-left"
      onClick={onToggle}
    >
      <span className="font-display text-lg font-bold">3. Справочник готовых формулировок</span>
      <Icon name={showRef ? "ChevronUp" : "ChevronDown"} size={18} />
    </button>
    {showRef && (
      <div className="mt-4 space-y-3">
        {TECH_REFERENCE.map((ref) => (
          <div key={ref.t} className="rounded-xl border border-border p-4">
            <p className="font-semibold text-primary">{ref.t}</p>
            <p className="text-sm mt-2">
              <span className="font-semibold">Обоснование:</span> {ref.o}
            </p>
            <p className="text-sm mt-1.5">
              <span className="font-semibold">Результативность:</span> {ref.r}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 gap-1.5"
              onClick={() => {
                addRow(ref);
                toast.success("Строка добавлена в матрицу");
              }}
            >
              <Icon name="Plus" size={14} />
              Вставить в матрицу
            </Button>
          </div>
        ))}
      </div>
    )}
  </section>
);

export default TechMatrixReference;
